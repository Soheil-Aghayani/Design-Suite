import math, os, sys, json
from PyQt5.QtCore import Qt, QPointF, QRectF, QTimer, QTime, QDateTime, QRect, QSize, QUrl
from PyQt5.QtGui import QPainter, QPen, QColor, QImage, QPixmap, QFont, QFontDatabase, QFontMetrics, QPolygonF, QRadialGradient
from PyQt5.QtSvg import QSvgGenerator
from PyQt5.QtMultimedia import QSoundEffect
from PyQt5.QtWidgets import (
    QApplication, QWidget, QLabel, QSpinBox, QDoubleSpinBox, QPushButton, QColorDialog,
    QFileDialog, QGridLayout, QGroupBox, QVBoxLayout, QHBoxLayout, QCheckBox,
    QComboBox, QLineEdit
)

# ---------- Helpers ----------
PERSIAN_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")
ROMAN_NUMS = ["", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]
ROMAN_NUMS_IIII = ["", "I", "II", "III", "IIII", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII"]

def to_persian_num(n: int) -> str:
    return str(n).translate(PERSIAN_DIGITS)

def ensure_tick_sounds():
    here = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else os.getcwd()
    tick_path = os.path.join(here, "clock_tick.wav")
    tock_path = os.path.join(here, "clock_tock.wav")
    
    import wave, struct, math, random
    
    def gen_wav(path, freq):
        if os.path.exists(path):
            return
        try:
            sample_rate = 22050
            duration = 0.04
            num_samples = int(sample_rate * duration)
            with wave.open(path, 'wb') as wav:
                wav.setnchannels(1)
                wav.setsampwidth(2)
                wav.setframerate(sample_rate)
                for i in range(num_samples):
                    t = i / sample_rate
                    decay = math.exp(-250 * t)
                    sine = math.sin(2 * math.pi * freq * t)
                    noise = random.uniform(-1.0, 1.0)
                    val = (0.7 * sine + 0.3 * noise) * decay * 8000
                    data = struct.pack('<h', int(val))
                    wav.writeframesraw(data)
        except Exception as e:
            print(f"Error generating sound {path}:", e)

    gen_wav(tick_path, 950)
    gen_wav(tock_path, 750)
    return tick_path, tock_path

def draw_hand(p: QPainter, cx: float, cy: float, length: float, angle_rad: float, base_w: float, tip_w: float, style: str, color: QColor):
    cos_a = math.cos(angle_rad)
    sin_a = math.sin(angle_rad)

    if style == "Minimalist Dots":
        # Draw a floating circle indicator at the tip
        p.setBrush(color)
        p.setPen(Qt.NoPen)
        tip_pos = QPointF(cx + length * cos_a, cy + length * sin_a)
        r = base_w * 0.7
        p.drawEllipse(tip_pos, r, r)
        p.setBrush(Qt.NoBrush)
    elif style == "Classic Tapered":
        # Draw a tapered polygon hand
        back_len = length * 0.12
        p1 = QPointF(cx - back_len * cos_a - (base_w / 2) * sin_a,
                     cy - back_len * sin_a + (base_w / 2) * cos_a)
        p2 = QPointF(cx - back_len * cos_a + (base_w / 2) * sin_a,
                     cy - back_len * sin_a - (base_w / 2) * cos_a)
        p3 = QPointF(cx + length * cos_a + (tip_w / 2) * sin_a,
                     cy + length * sin_a - (tip_w / 2) * cos_a)
        p4 = QPointF(cx + length * cos_a - (tip_w / 2) * sin_a,
                     cy + length * sin_a + (tip_w / 2) * cos_a)
        p.setPen(Qt.NoPen)
        p.setBrush(color)
        poly = QPolygonF([p1, p2, p3, p4])
        p.drawPolygon(poly)
        p.setBrush(Qt.NoBrush)
    elif style == "Breguet":
        # Breguet design: line with a hollow circle near the tip
        c_dist = length * 0.78
        c_pos = QPointF(cx + c_dist * cos_a, cy + c_dist * sin_a)
        r_outer = base_w * 1.5
        r_inner = base_w * 0.7

        pen = QPen(color, tip_w, cap=Qt.RoundCap)
        p.setPen(pen)
        # First part of line
        end1 = QPointF(cx + (c_dist - r_outer) * cos_a, cy + (c_dist - r_outer) * sin_a)
        p.drawLine(QPointF(cx, cy), end1)
        # Second part of line
        start2 = QPointF(cx + (c_dist + r_outer) * cos_a, cy + (c_dist + r_outer) * sin_a)
        end2 = QPointF(cx + length * cos_a, cy + length * sin_a)
        p.drawLine(start2, end2)

        # Hollow circle outline
        p.setPen(QPen(color, tip_w))
        p.setBrush(Qt.transparent)
        p.drawEllipse(c_pos, r_outer, r_outer)
    else:  # "Straight Line"
        pen = QPen(color, base_w, cap=Qt.RoundCap)
        p.setPen(pen)
        p.drawLine(QPointF(cx, cy), QPointF(cx + length * cos_a, cy + length * sin_a))

# ---------- Clock rendering ----------
def draw_clock_on_device(
    device,
    hour: float,
    minute: float,
    second: float,
    color: QColor,
    hands_color: QColor,
    face_color: QColor,
    face_grad_color: QColor,
    size_px: int,
    font_family: str,
    show_hour: bool = True,
    show_minute: bool = True,
    show_second: bool = True,
    digit_style: str = "Persian",
    show_ring: bool = True,
    show_ticks: bool = True,
    show_numbers: bool = True,
    hands_style: str = "Straight Line",
    show_shadow: bool = True,
    tick_style: str = "Line Ticks",
    use_gradient: bool = False,
    brand_text: str = "",
    sub_text: str = "",
    show_inner_ring: bool = False,
    double_ring: bool = False,
    show_minute_ticks: bool = True,
    show_second_tail: bool = True,
    use_iiii: bool = False
):
    p = QPainter(device)
    p.setRenderHint(QPainter.Antialiasing, True)

    # Geometry
    cx = cy = size_px / 2
    R  = size_px * 0.46         # outer radius
    ring_w = max(2.0, size_px * 0.015)
    num_radius = R * 0.78
    inner_R = R * 0.65

    # Face background inside the ring
    if face_color.alpha() > 0:
        if use_gradient and face_grad_color.alpha() > 0:
            grad = QRadialGradient(QPointF(cx, cy), R)
            grad.setColorAt(0, face_color)
            grad.setColorAt(1, face_grad_color)
            p.setBrush(grad)
        else:
            p.setBrush(face_color)
        p.setPen(Qt.NoPen)
        p.drawEllipse(QPointF(cx, cy), R, R)
        p.setBrush(Qt.NoBrush)

    # Dial Soft Drop Shadow
    if show_shadow:
        s_offset = max(1.5, size_px * 0.007)
        shadow_color = QColor(0, 0, 0, 35)
        p.translate(s_offset, s_offset)

        if show_ring:
            if double_ring:
                p.setPen(QPen(shadow_color, ring_w * 0.3, cap=Qt.RoundCap, join=Qt.RoundJoin))
                p.drawEllipse(QPointF(cx, cy), R, R)
                p.drawEllipse(QPointF(cx, cy), R - ring_w * 0.6, R - ring_w * 0.6)
            else:
                p.setPen(QPen(shadow_color, ring_w, cap=Qt.RoundCap, join=Qt.RoundJoin))
                p.drawEllipse(QPointF(cx, cy), R, R)

        if show_inner_ring:
            p.setPen(QPen(shadow_color, max(1.0, size_px * 0.003)))
            p.drawEllipse(QPointF(cx, cy), inner_R, inner_R)

        if show_ticks and tick_style != "No Ticks":
            tick_sh_pen = QPen(shadow_color, max(1.0, size_px * 0.006), cap=Qt.RoundCap)
            major_sh_pen = QPen(shadow_color, max(1.5, size_px * 0.010), cap=Qt.RoundCap)
            for i in range(60):
                if tick_style == "Cardinal Ticks" and (i % 15 != 0):
                    continue
                if not show_minute_ticks and (i % 5 != 0):
                    continue
                ang = math.radians(-90 + i * 6)
                
                if tick_style == "Circle Ticks":
                    p.setBrush(shadow_color)
                    p.setPen(Qt.NoPen)
                    dot_r = max(1.5, size_px * (0.009 if i % 5 == 0 else 0.004))
                    dot_pos = QPointF(cx + (R - ring_w * 1.5) * math.cos(ang), cy + (R - ring_w * 1.5) * math.sin(ang))
                    p.drawEllipse(dot_pos, dot_r, dot_r)
                    p.setBrush(Qt.NoBrush)
                else:
                    outer = QPointF(cx + R * math.cos(ang), cy + R * math.sin(ang))
                    inner_len = size_px * (0.03 if i % 5 == 0 else 0.015)
                    inner = QPointF(cx + (R - inner_len) * math.cos(ang), cy + (R - inner_len) * math.sin(ang))
                    p.setPen(major_sh_pen if i % 5 == 0 else tick_sh_pen)
                    p.drawLine(inner, outer)

        if show_numbers:
            p.setPen(shadow_color)
            font = QFont(font_family)
            font.setPixelSize(int(size_px * 0.10))
            p.setFont(font)
            fm = QFontMetrics(font)
            roman_list = ROMAN_NUMS_IIII if use_iiii else ROMAN_NUMS
            for n in range(1, 13):
                ang = math.radians(-90 + n * 30)
                tx = cx + num_radius * math.cos(ang)
                ty = cy + num_radius * math.sin(ang)
                text = to_persian_num(n) if digit_style == "Persian" else (roman_list[n] if digit_style == "Roman" else str(n))
                tw = fm.horizontalAdvance(text)
                th = fm.height()
                p.drawText(QRectF(tx - tw / 2, ty - th / 2, tw, th), Qt.AlignCenter, text)

        # Brand Text Shadow
        if brand_text:
            p.setPen(shadow_color)
            brand_font = QFont(font_family)
            brand_font.setPixelSize(int(size_px * 0.05))
            brand_font.setBold(True)
            p.setFont(brand_font)
            fm_brand = QFontMetrics(brand_font)
            tw = fm_brand.horizontalAdvance(brand_text)
            th = fm_brand.height()
            p.drawText(QRectF(cx - tw / 2, cy - R * 0.45 - th / 2, tw, th), Qt.AlignCenter, brand_text)

        if sub_text:
            p.setPen(shadow_color)
            sub_font = QFont(font_family)
            sub_font.setPixelSize(int(size_px * 0.035))
            sub_font.setLetterSpacing(QFont.AbsoluteSpacing, size_px * 0.005)
            p.setFont(sub_font)
            fm_sub = QFontMetrics(sub_font)
            tw = fm_sub.horizontalAdvance(sub_text)
            th = fm_sub.height()
            p.drawText(QRectF(cx - tw / 2, cy + R * 0.45 - th / 2, tw, th), Qt.AlignCenter, sub_text)

        p.translate(-s_offset, -s_offset)

    # Dial Foreground
    ring_pen   = QPen(color, ring_w, cap=Qt.RoundCap, join=Qt.RoundJoin)
    tick_pen   = QPen(color, max(1.0, size_px * 0.006), cap=Qt.RoundCap)
    major_pen  = QPen(color, max(1.5, size_px * 0.010), cap=Qt.RoundCap)
    inner_pen  = QPen(color, max(1.0, size_px * 0.003), cap=Qt.RoundCap)

    if show_ring:
        if double_ring:
            p.setPen(QPen(color, ring_w * 0.3, cap=Qt.RoundCap, join=Qt.RoundJoin))
            p.drawEllipse(QPointF(cx, cy), R, R)
            p.drawEllipse(QPointF(cx, cy), R - ring_w * 0.6, R - ring_w * 0.6)
        else:
            p.setPen(ring_pen)
            p.drawEllipse(QPointF(cx, cy), R, R)

    if show_inner_ring:
        p.setPen(inner_pen)
        p.drawEllipse(QPointF(cx, cy), inner_R, inner_R)

    if show_ticks and tick_style != "No Ticks":
        for i in range(60):
            if tick_style == "Cardinal Ticks" and (i % 15 != 0):
                continue
            if not show_minute_ticks and (i % 5 != 0):
                continue
            ang = math.radians(-90 + i * 6)
            
            if tick_style == "Circle Ticks":
                p.setBrush(color)
                p.setPen(Qt.NoPen)
                dot_r = max(1.5, size_px * (0.009 if i % 5 == 0 else 0.004))
                dot_pos = QPointF(cx + (R - ring_w * 1.5) * math.cos(ang), cy + (R - ring_w * 1.5) * math.sin(ang))
                p.drawEllipse(dot_pos, dot_r, dot_r)
                p.setBrush(Qt.NoBrush)
            else:
                outer = QPointF(cx + R * math.cos(ang), cy + R * math.sin(ang))
                inner_len = size_px * (0.03 if i % 5 == 0 else 0.015)
                inner = QPointF(cx + (R - inner_len) * math.cos(ang), cy + (R - inner_len) * math.sin(ang))
                p.setPen(major_pen if i % 5 == 0 else tick_pen)
                p.drawLine(inner, outer)

    if show_numbers:
        p.setPen(color)
        font = QFont(font_family)
        font.setPixelSize(int(size_px * 0.10))
        p.setFont(font)
        fm = QFontMetrics(font)
        roman_list = ROMAN_NUMS_IIII if use_iiii else ROMAN_NUMS
        for n in range(1, 13):
            ang = math.radians(-90 + n * 30)
            tx = cx + num_radius * math.cos(ang)
            ty = cy + num_radius * math.sin(ang)
            text = to_persian_num(n) if digit_style == "Persian" else (roman_list[n] if digit_style == "Roman" else str(n))
            tw = fm.horizontalAdvance(text)
            th = fm.height()
            p.drawText(QRectF(tx - tw / 2, ty - th / 2, tw, th), Qt.AlignCenter, text)

    # Dial Brand Texts Foreground
    if brand_text:
        p.setPen(color)
        brand_font = QFont(font_family)
        brand_font.setPixelSize(int(size_px * 0.05))
        brand_font.setBold(True)
        p.setFont(brand_font)
        fm_brand = QFontMetrics(brand_font)
        tw = fm_brand.horizontalAdvance(brand_text)
        th = fm_brand.height()
        p.drawText(QRectF(cx - tw / 2, cy - R * 0.45 - th / 2, tw, th), Qt.AlignCenter, brand_text)

    if sub_text:
        p.setPen(color)
        sub_font = QFont(font_family)
        sub_font.setPixelSize(int(size_px * 0.035))
        sub_font.setLetterSpacing(QFont.AbsoluteSpacing, size_px * 0.005)
        p.setFont(sub_font)
        fm_sub = QFontMetrics(sub_font)
        tw = fm_sub.horizontalAdvance(sub_text)
        th = fm_sub.height()
        p.drawText(QRectF(cx - tw / 2, cy + R * 0.45 - th / 2, tw, th), Qt.AlignCenter, sub_text)

    # Dimensions for Hands
    m_len = R * 0.72
    h_len = R * 0.52
    s_len = R * 0.85

    h_w = max(2.0, size_px * 0.030)
    m_w = max(2.0, size_px * 0.022)
    s_w = max(1.0, size_px * 0.008)

    # Hands Soft Drop Shadow (Floating higher, so larger offset)
    if show_shadow:
        s_offset = max(2.0, size_px * 0.012)
        shadow_color = QColor(0, 0, 0, 45)
        p.translate(s_offset, s_offset)

        if show_minute:
            m_ang = math.radians(-90 + minute * 6)
            draw_hand(p, cx, cy, m_len, m_ang, m_w, m_w * 0.6, hands_style, shadow_color)

        if show_hour:
            hour12 = (hour % 12) + (minute / 60.0)
            h_ang = math.radians(-90 + hour12 * 30)
            draw_hand(p, cx, cy, h_len, h_ang, h_w, h_w * 0.6, hands_style, shadow_color)

        if show_second:
            s_ang = math.radians(-90 + second * 6)
            # Main line shadow
            draw_hand(p, cx, cy, s_len, s_ang, s_w, s_w, "Straight Line", shadow_color)
            # Tail shadow
            if show_second_tail:
                tail_len = s_len * 0.16
                tail_ang = s_ang + math.pi
                p.setPen(QPen(shadow_color, s_w, cap=Qt.RoundCap))
                p.drawLine(QPointF(cx, cy), QPointF(cx + tail_len * math.cos(tail_ang), cy + tail_len * math.sin(tail_ang)))
                
                dot_pos = QPointF(cx + (tail_len * 0.75) * math.cos(tail_ang), cy + (tail_len * 0.75) * math.sin(tail_ang))
                p.setBrush(shadow_color)
                p.setPen(Qt.NoPen)
                dot_r = max(2.0, size_px * 0.007)
                p.drawEllipse(dot_pos, dot_r, dot_r)
                p.setBrush(Qt.NoBrush)

        # Center pin shadow
        p.setPen(QPen(shadow_color, 1))
        center_r = max(2.0, size_px * 0.018)
        p.drawEllipse(QPointF(cx, cy), center_r, center_r)

        p.translate(-s_offset, -s_offset)

    # Hands Foreground
    if show_minute:
        m_ang = math.radians(-90 + minute * 6)
        draw_hand(p, cx, cy, m_len, m_ang, m_w, m_w * 0.6, hands_style, hands_color)

    if show_hour:
        hour12 = (hour % 12) + (minute / 60.0)
        h_ang = math.radians(-90 + hour12 * 30)
        draw_hand(p, cx, cy, h_len, h_ang, h_w, h_w * 0.6, hands_style, hands_color)

    if show_second:
        s_ang = math.radians(-90 + second * 6)
        draw_hand(p, cx, cy, s_len, s_ang, s_w, s_w, "Straight Line", hands_color)
        
        # Second Hand Counterweight Tail
        if show_second_tail:
            tail_len = s_len * 0.16
            tail_ang = s_ang + math.pi
            p.setPen(QPen(hands_color, s_w, cap=Qt.RoundCap))
            p.drawLine(QPointF(cx, cy), QPointF(cx + tail_len * math.cos(tail_ang), cy + tail_len * math.sin(tail_ang)))
            
            dot_pos = QPointF(cx + (tail_len * 0.75) * math.cos(tail_ang), cy + (tail_len * 0.75) * math.sin(tail_ang))
            p.setBrush(hands_color)
            p.setPen(Qt.NoPen)
            dot_r = max(2.0, size_px * 0.007)
            p.drawEllipse(dot_pos, dot_r, dot_r)
            p.setBrush(Qt.NoBrush)

    # Center pin
    p.setPen(QPen(hands_color, 1))
    center_r = max(2.0, size_px * 0.018)
    p.drawEllipse(QPointF(cx, cy), center_r, center_r)

    p.end()

def make_clock_image(
    hour: float,
    minute: float,
    second: float,
    color: QColor,
    hands_color: QColor,
    face_color: QColor,
    face_grad_color: QColor,
    size_px: int,
    font_family: str,
    show_hour: bool = True,
    show_minute: bool = True,
    show_second: bool = True,
    digit_style: str = "Persian",
    show_ring: bool = True,
    show_ticks: bool = True,
    show_numbers: bool = True,
    hands_style: str = "Straight Line",
    show_shadow: bool = True,
    tick_style: str = "Line Ticks",
    use_gradient: bool = False,
    brand_text: str = "",
    sub_text: str = "",
    show_inner_ring: bool = False,
    double_ring: bool = False,
    show_minute_ticks: bool = True,
    show_second_tail: bool = True,
    use_iiii: bool = False
) -> QImage:
    img = QImage(size_px, size_px, QImage.Format_ARGB32)
    img.fill(Qt.transparent)
    draw_clock_on_device(
        img, hour, minute, second, color, hands_color, face_color, face_grad_color,
        size_px, font_family, show_hour, show_minute, show_second, digit_style,
        show_ring, show_ticks, show_numbers, hands_style, show_shadow, tick_style,
        use_gradient, brand_text, sub_text, show_inner_ring, double_ring,
        show_minute_ticks, show_second_tail, use_iiii
    )
    return img

# ---------- UI ----------
class ClockApp(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Vazir Clock Designer")

        self.is_loaded = False

        # Try to load Vazir.ttf from working directory
        self.vazir_family = self.load_vazir_font()

        # State
        self.color = QColor("#1e40af")            # default dial color
        self.hands_color = QColor("#dc2626")      # default hands color
        self.face_color = QColor(0, 0, 0, 0)      # default face color (transparent)
        self.face_grad_color = QColor(0, 0, 0, 0) # default face gradient outer
        self.preview_size = 520
        self.last_sound_second = -1
        self.tick_path, self.tock_path = ensure_tick_sounds()
        
        self.tick_effect = QSoundEffect()
        self.tick_effect.setSource(QUrl.fromLocalFile(self.tick_path))
        self.tick_effect.setVolume(1.0)
        
        self.tock_effect = QSoundEffect()
        self.tock_effect.setSource(QUrl.fromLocalFile(self.tock_path))
        self.tock_effect.setVolume(1.0)

        # Live Timer Setup
        self.timer = QTimer(self)
        self.timer.timeout.connect(self.on_live_timer_timeout)

        # Widgets
        self.preview_label = QLabel()
        self.preview_label.setFixedSize(self.preview_size, self.preview_size)
        self.preview_label.setAlignment(Qt.AlignCenter)
        self.preview_label.setStyleSheet("border:1px solid #ddd;")

        self.hour_box = QSpinBox();  self.hour_box.setRange(0, 23); self.hour_box.setValue(10)
        self.min_box  = QSpinBox();  self.min_box.setRange(0, 59);  self.min_box.setValue(10)
        self.sec_box  = QSpinBox();  self.sec_box.setRange(0, 59);  self.sec_box.setValue(0)
        self.size_box = QSpinBox();  self.size_box.setRange(256, 4096); self.size_box.setValue(1024)
        
        self.live_time_cb = QCheckBox("Live Time")
        self.live_time_cb.setChecked(False)

        self.smooth_sweep_cb = QCheckBox("Smooth Sweep")
        self.smooth_sweep_cb.setChecked(True)
        self.smooth_sweep_cb.setEnabled(False)

        self.sound_cb = QCheckBox("Tick Sound")
        self.sound_cb.setChecked(False)
        self.sound_cb.setEnabled(False)

        self.tz_box = QDoubleSpinBox()
        self.tz_box.setRange(-12.0, 14.0)
        self.tz_box.setSingleStep(0.5)
        self.tz_box.setValue(0.0)
        self.tz_box.setEnabled(False)

        self.use_iiii_cb = QCheckBox("Watchmaker's 'IIII'")
        self.use_iiii_cb.setChecked(False)

        # Categorize system fonts
        self.db = QFontDatabase()
        all_families = sorted(self.db.families())
        self.fonts_by_category = {
            "All Fonts": all_families,
            "Persian / Arabic": [],
            "Monospace": [],
            "Other Fonts": []
        }
        for family in all_families:
            systems = self.db.writingSystems(family)
            is_arabic = QFontDatabase.Arabic in systems
            is_mono = self.db.isFixedPitch(family)
            if is_arabic:
                self.fonts_by_category["Persian / Arabic"].append(family)
            if is_mono:
                self.fonts_by_category["Monospace"].append(family)
            if not is_arabic and not is_mono:
                self.fonts_by_category["Other Fonts"].append(family)

        self.category_combo = QComboBox()
        self.category_combo.addItems(list(self.fonts_by_category.keys()))
        self.font_combo = QComboBox()

        self.digit_combo = QComboBox()
        self.digit_combo.addItems(["Persian (۱, ۲, ۳...)", "English (1, 2, 3...)", "Roman (I, II, III...)"])

        # Preset Themes combo box
        self.theme_combo = QComboBox()
        self.theme_combo.addItems(["Custom", "Classic Indigo", "Dark Minimalist", "Luxury Gold", "Emerald Premium", "Cyberpunk Neon", "Soft Rose"])
        self.theme_combo.setCurrentText("Custom")

        # Dial Components Toggles
        self.show_ring_cb = QCheckBox("Show Outer Ring")
        self.show_ring_cb.setChecked(True)
        self.show_ticks_cb = QCheckBox("Show Ticks")
        self.show_ticks_cb.setChecked(True)
        self.show_numbers_cb = QCheckBox("Show Numbers")
        self.show_numbers_cb.setChecked(True)
        self.show_shadow_cb = QCheckBox("Enable Drop Shadows")
        self.show_shadow_cb.setChecked(True)
        
        # Ticks styles
        self.tick_style_combo = QComboBox()
        self.tick_style_combo.addItems(["Line Ticks", "Circle Ticks", "Cardinal Ticks", "No Ticks"])

        # Inner track ring
        self.show_inner_ring_cb = QCheckBox("Show Inner Track Ring")
        self.show_inner_ring_cb.setChecked(False)

        # Transparency Checkerboard Toggle
        self.show_checkerboard_cb = QCheckBox("Preview Checkerboard")
        self.show_checkerboard_cb.setChecked(True)

        # Radial Face Gradient Toggle
        self.use_gradient_cb = QCheckBox("Radial Sunburst Face")
        self.use_gradient_cb.setChecked(False)

        # Watchmaker Dial Additions
        self.double_ring_cb = QCheckBox("Double Bezel Ring")
        self.double_ring_cb.setChecked(False)

        self.show_minute_ticks_cb = QCheckBox("Show Minute Ticks")
        self.show_minute_ticks_cb.setChecked(True)

        # Hands Settings
        self.show_hour_cb = QCheckBox("Show Hour Hand")
        self.show_hour_cb.setChecked(True)
        self.show_min_cb = QCheckBox("Show Minute Hand")
        self.show_min_cb.setChecked(True)
        self.show_second_cb = QCheckBox("Show Second Hand")
        self.show_second_cb.setChecked(True)
        self.show_second_tail_cb = QCheckBox("Second Hand Tail")
        self.show_second_tail_cb.setChecked(True)

        self.hands_style_combo = QComboBox()
        self.hands_style_combo.addItems(["Straight Line", "Classic Tapered", "Breguet", "Minimalist Dots"])

        # Branding inputs
        self.brand_text = QLineEdit("")
        self.sub_text = QLineEdit("")

        # Color and Actions Buttons
        self.pick_btn = QPushButton("Dial Color")
        self.pick_hands_btn = QPushButton("Hands Color")
        self.pick_face_btn = QPushButton("Face Center")
        self.pick_face_grad_btn = QPushButton("Face Outer")
        
        self.copy_btn = QPushButton("Copy to Clipboard")
        self.save_btn = QPushButton("Save PNG…")
        self.save_svg_btn = QPushButton("Save SVG…")

        # Layout setup
        grid = QGridLayout()
        grid.addWidget(QLabel("Hour (0–23):"), 0, 0)
        grid.addWidget(self.hour_box,        0, 1)
        grid.addWidget(QLabel("Minute (0–59):"), 1, 0)
        grid.addWidget(self.min_box,            1, 1)
        grid.addWidget(QLabel("Second (0–59):"), 2, 0)
        grid.addWidget(self.sec_box,            2, 1)
        checkbox_layout = QHBoxLayout()
        checkbox_layout.addWidget(self.live_time_cb)
        checkbox_layout.addWidget(self.smooth_sweep_cb)
        checkbox_layout.addWidget(self.sound_cb)
        grid.addLayout(checkbox_layout, 3, 0, 1, 2)
        grid.addWidget(QLabel("UTC Offset (hrs):"), 4, 0)
        grid.addWidget(self.tz_box,            4, 1)
        grid.addWidget(QLabel("Theme Preset:"),  5, 0)
        grid.addWidget(self.theme_combo,        5, 1)
        grid.addWidget(QLabel("Export Size (px):"), 6, 0)
        grid.addWidget(self.size_box,          6, 1)
        grid.addWidget(QLabel("Font Category:"), 7, 0)
        grid.addWidget(self.category_combo,    7, 1)
        grid.addWidget(QLabel("Font Name:"),     8, 0)
        grid.addWidget(self.font_combo,        8, 1)
        grid.addWidget(QLabel("Digit Style:"),   9, 0)
        grid.addWidget(self.digit_combo,       9, 1)

        controls = QGroupBox("Main Controls")
        controls.setLayout(grid)

        dial_group = QGroupBox("Dial Options")
        dial_layout = QVBoxLayout()
        dial_layout.addWidget(self.show_ring_cb)
        dial_layout.addWidget(self.double_ring_cb)
        dial_layout.addWidget(self.show_inner_ring_cb)
        dial_layout.addWidget(self.show_ticks_cb)
        dial_layout.addWidget(self.show_minute_ticks_cb)
        dial_layout.addWidget(QLabel("Tick Style:"))
        dial_layout.addWidget(self.tick_style_combo)
        dial_layout.addWidget(self.show_numbers_cb)
        dial_layout.addWidget(self.use_iiii_cb)
        dial_layout.addWidget(self.show_shadow_cb)
        dial_layout.addWidget(self.use_gradient_cb)
        dial_layout.addWidget(self.show_checkerboard_cb)
        dial_group.setLayout(dial_layout)

        hands_group = QGroupBox("Hand Options")
        hands_layout = QVBoxLayout()
        hands_layout.addWidget(self.show_hour_cb)
        hands_layout.addWidget(self.show_min_cb)
        hands_layout.addWidget(self.show_second_cb)
        hands_layout.addWidget(self.show_second_tail_cb)
        hands_layout.addWidget(QLabel("Hands Style:"))
        hands_layout.addWidget(self.hands_style_combo)
        hands_group.setLayout(hands_layout)

        brand_group = QGroupBox("Branding Options")
        brand_layout = QGridLayout()
        brand_layout.addWidget(QLabel("Dial Logo:"), 0, 0)
        brand_layout.addWidget(self.brand_text, 0, 1)
        brand_layout.addWidget(QLabel("Dial Subtitle:"), 1, 0)
        brand_layout.addWidget(self.sub_text, 1, 1)
        brand_group.setLayout(brand_layout)

        # Layout Assembly
        root = QHBoxLayout(self)
        root.addWidget(self.preview_label)

        # Control Panel Layout (horizontal layout of two columns)
        control_panel_layout = QHBoxLayout()

        # Column 1: Main Controls & Branding
        col1 = QVBoxLayout()
        col1.addWidget(controls)
        col1.addWidget(brand_group)
        col1.addStretch(1)

        # Column 2: Dial Options, Hand Options, Colors & Actions
        col2 = QVBoxLayout()
        col2.addWidget(dial_group)
        col2.addWidget(hands_group)

        color_layout = QGridLayout()
        color_layout.addWidget(self.pick_btn,           0, 0)
        color_layout.addWidget(self.pick_hands_btn,    0, 1)
        color_layout.addWidget(self.pick_face_btn,     1, 0)
        color_layout.addWidget(self.pick_face_grad_btn,1, 1)
        col2.addLayout(color_layout)

        action_layout = QHBoxLayout()
        action_layout.addWidget(self.copy_btn)
        action_layout.addWidget(self.save_btn)
        action_layout.addWidget(self.save_svg_btn)
        col2.addLayout(action_layout)
        col2.addStretch(1)

        control_panel_layout.addLayout(col1)
        control_panel_layout.addLayout(col2)
        root.addLayout(control_panel_layout)

        # Signals connections
        self.hour_box.valueChanged.connect(self.update_preview)
        self.min_box.valueChanged.connect(self.update_preview)
        self.sec_box.valueChanged.connect(self.update_preview)
        self.live_time_cb.stateChanged.connect(self.on_live_time_toggled)
        self.tz_box.valueChanged.connect(self.update_preview)
        self.theme_combo.currentTextChanged.connect(self.on_theme_changed)
        self.category_combo.currentTextChanged.connect(self.update_font_list)
        self.font_combo.currentTextChanged.connect(self.update_preview)
        self.digit_combo.currentTextChanged.connect(self.update_preview)
        
        self.show_ring_cb.stateChanged.connect(self.update_preview)
        self.double_ring_cb.stateChanged.connect(self.update_preview)
        self.show_inner_ring_cb.stateChanged.connect(self.update_preview)
        self.show_ticks_cb.stateChanged.connect(self.update_preview)
        self.show_minute_ticks_cb.stateChanged.connect(self.update_preview)
        self.tick_style_combo.currentTextChanged.connect(self.update_preview)
        self.show_numbers_cb.stateChanged.connect(self.update_preview)
        self.show_shadow_cb.stateChanged.connect(self.update_preview)
        self.use_gradient_cb.stateChanged.connect(self.update_preview)
        self.show_checkerboard_cb.stateChanged.connect(self.update_preview)
        
        self.show_hour_cb.stateChanged.connect(self.update_preview)
        self.show_min_cb.stateChanged.connect(self.update_preview)
        self.show_second_cb.stateChanged.connect(self.update_preview)
        self.show_second_tail_cb.stateChanged.connect(self.update_preview)
        self.hands_style_combo.currentTextChanged.connect(self.update_preview)

        self.brand_text.textChanged.connect(self.update_preview)
        self.sub_text.textChanged.connect(self.update_preview)

        self.pick_btn.clicked.connect(self.choose_dial_color)
        self.pick_hands_btn.clicked.connect(self.choose_hands_color)
        self.pick_face_btn.clicked.connect(self.choose_face_color)
        self.pick_face_grad_btn.clicked.connect(self.choose_face_grad_color)
        
        self.copy_btn.clicked.connect(self.copy_to_clipboard)
        self.save_btn.clicked.connect(self.save_png)
        self.smooth_sweep_cb.stateChanged.connect(self.on_smooth_sweep_toggled)
        self.sound_cb.stateChanged.connect(self.update_preview)
        self.use_iiii_cb.stateChanged.connect(self.update_preview)
        self.save_svg_btn.clicked.connect(self.save_svg)

        # Set default category and populate
        default_cat = "Persian / Arabic" if self.fonts_by_category["Persian / Arabic"] else "All Fonts"
        self.category_combo.setCurrentText(default_cat)
        self.update_font_list()

        # Load settings memory if available
        self.load_settings()

        # Enable auto-saving now that loading is fully completed
        self.is_loaded = True

        self.update_preview()

    def load_vazir_font(self) -> str:
        """Load Vazir.ttf if available and return its family name; fall back to system font."""
        here = os.path.abspath(os.path.dirname(__file__)) if "__file__" in globals() else os.getcwd()
        vazir_path = os.path.join(here, "Vazir.ttf")
        family = "Vazir"
        if os.path.exists(vazir_path):
            fid = QFontDatabase.addApplicationFont(vazir_path)
            fams = QFontDatabase.applicationFontFamilies(fid)
            if fams:
                family = fams[0]
        return family

    def update_font_list(self):
        category = self.category_combo.currentText()
        families = self.fonts_by_category.get(category, [])

        # Block signals
        self.font_combo.blockSignals(True)

        # Save selection
        current_selection = self.font_combo.currentText()
        self.font_combo.clear()
        self.font_combo.addItems(families)

        # Restore
        index = self.font_combo.findText(current_selection)
        if index >= 0:
            self.font_combo.setCurrentIndex(index)
        else:
            vazir_index = self.font_combo.findText(self.vazir_family)
            if vazir_index >= 0:
                self.font_combo.setCurrentIndex(vazir_index)
            else:
                self.font_combo.setCurrentIndex(0 if self.font_combo.count() > 0 else -1)

        self.font_combo.blockSignals(False)
        self.update_preview()

    def block_all_signals(self, block: bool):
        self.hour_box.blockSignals(block)
        self.min_box.blockSignals(block)
        self.sec_box.blockSignals(block)
        self.size_box.blockSignals(block)
        self.live_time_cb.blockSignals(block)
        self.smooth_sweep_cb.blockSignals(block)
        self.sound_cb.blockSignals(block)
        self.tz_box.blockSignals(block)
        self.category_combo.blockSignals(block)
        self.font_combo.blockSignals(block)
        self.digit_combo.blockSignals(block)
        self.theme_combo.blockSignals(block)
        self.show_ring_cb.blockSignals(block)
        self.double_ring_cb.blockSignals(block)
        self.show_inner_ring_cb.blockSignals(block)
        self.show_ticks_cb.blockSignals(block)
        self.show_minute_ticks_cb.blockSignals(block)
        self.tick_style_combo.blockSignals(block)
        self.show_numbers_cb.blockSignals(block)
        self.use_iiii_cb.blockSignals(block)
        self.show_shadow_cb.blockSignals(block)
        self.use_gradient_cb.blockSignals(block)
        self.show_checkerboard_cb.blockSignals(block)
        self.show_hour_cb.blockSignals(block)
        self.show_min_cb.blockSignals(block)
        self.show_second_cb.blockSignals(block)
        self.show_second_tail_cb.blockSignals(block)
        self.hands_style_combo.blockSignals(block)
        self.brand_text.blockSignals(block)
        self.sub_text.blockSignals(block)

    def load_settings(self):
        here = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else os.getcwd()
        config_path = os.path.join(here, "config.json")
        if not os.path.exists(config_path):
            return
        try:
            with open(config_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.block_all_signals(True)

            if "hour" in data: self.hour_box.setValue(data["hour"])
            if "minute" in data: self.min_box.setValue(data["minute"])
            if "second" in data: self.sec_box.setValue(data["second"])
            if "export_size" in data: self.size_box.setValue(data["export_size"])
            if "live_time" in data: self.live_time_cb.setChecked(data["live_time"])
            if "smooth_sweep" in data: self.smooth_sweep_cb.setChecked(data["smooth_sweep"])
            if "tick_sound" in data: self.sound_cb.setChecked(data["tick_sound"])
            if "use_iiii" in data: self.use_iiii_cb.setChecked(data["use_iiii"])
            if "tz_offset" in data: self.tz_box.setValue(data["tz_offset"])
            if "digit_style" in data: self.digit_combo.setCurrentText(data["digit_style"])
            if "theme" in data: self.theme_combo.setCurrentText(data["theme"])
            
            if "dial_color" in data: self.color = QColor(data["dial_color"])
            if "hands_color" in data: self.hands_color = QColor(data["hands_color"])
            if "face_color" in data: self.face_color = QColor(data["face_color"])
            if "face_grad_color" in data: self.face_grad_color = QColor(data["face_grad_color"])

            if "show_ring" in data: self.show_ring_cb.setChecked(data["show_ring"])
            if "double_ring" in data: self.double_ring_cb.setChecked(data["double_ring"])
            if "show_inner_ring" in data: self.show_inner_ring_cb.setChecked(data["show_inner_ring"])
            if "show_ticks" in data: self.show_ticks_cb.setChecked(data["show_ticks"])
            if "show_minute_ticks" in data: self.show_minute_ticks_cb.setChecked(data["show_minute_ticks"])
            if "tick_style" in data: self.tick_style_combo.setCurrentText(data["tick_style"])
            if "show_numbers" in data: self.show_numbers_cb.setChecked(data["show_numbers"])
            if "show_shadow" in data: self.show_shadow_cb.setChecked(data["show_shadow"])
            if "use_gradient" in data: self.use_gradient_cb.setChecked(data["use_gradient"])
            if "show_checkerboard" in data: self.show_checkerboard_cb.setChecked(data["show_checkerboard"])

            if "show_hour_hand" in data: self.show_hour_cb.setChecked(data["show_hour_hand"])
            if "show_minute_hand" in data: self.show_min_cb.setChecked(data["show_minute_hand"])
            if "show_second_hand" in data: self.show_second_cb.setChecked(data["show_second_hand"])
            if "show_second_tail" in data: self.show_second_tail_cb.setChecked(data["show_second_tail"])
            if "hands_style" in data: self.hands_style_combo.setCurrentText(data["hands_style"])

            if "brand_text" in data: self.brand_text.setText(data["brand_text"])
            if "sub_text" in data: self.sub_text.setText(data["sub_text"])

            if "font_category" in data and data["font_category"] in self.fonts_by_category:
                self.category_combo.setCurrentText(data["font_category"])
                self.update_font_list()
                if "font_name" in data:
                    self.font_combo.setCurrentText(data["font_name"])

            self.block_all_signals(False)
            
            # Explicitly run toggled function to trigger proper timer states
            self.on_live_time_toggled()
        except Exception as e:
            print("Error loading config:", e)
            self.block_all_signals(False)

    def save_settings(self):
        if not getattr(self, "is_loaded", False):
            return
        here = os.path.dirname(os.path.abspath(__file__)) if "__file__" in globals() else os.getcwd()
        config_path = os.path.join(here, "config.json")
        try:
            data = {
                "hour": self.hour_box.value(),
                "minute": self.min_box.value(),
                "second": self.sec_box.value(),
                "export_size": self.size_box.value(),
                "live_time": self.live_time_cb.isChecked(),
                "smooth_sweep": self.smooth_sweep_cb.isChecked(),
                "tick_sound": self.sound_cb.isChecked(),
                "use_iiii": self.use_iiii_cb.isChecked(),
                "tz_offset": self.tz_box.value(),
                "font_category": self.category_combo.currentText(),
                "font_name": self.font_combo.currentText(),
                "digit_style": self.digit_combo.currentText(),
                "theme": self.theme_combo.currentText(),
                "dial_color": self.color.name(QColor.HexArgb),
                "hands_color": self.hands_color.name(QColor.HexArgb),
                "face_color": self.face_color.name(QColor.HexArgb),
                "face_grad_color": self.face_grad_color.name(QColor.HexArgb),
                "show_ring": self.show_ring_cb.isChecked(),
                "double_ring": self.double_ring_cb.isChecked(),
                "show_inner_ring": self.show_inner_ring_cb.isChecked(),
                "show_ticks": self.show_ticks_cb.isChecked(),
                "show_minute_ticks": self.show_minute_ticks_cb.isChecked(),
                "tick_style": self.tick_style_combo.currentText(),
                "show_numbers": self.show_numbers_cb.isChecked(),
                "show_shadow": self.show_shadow_cb.isChecked(),
                "use_gradient": self.use_gradient_cb.isChecked(),
                "show_checkerboard": self.show_checkerboard_cb.isChecked(),
                "show_hour_hand": self.show_hour_cb.isChecked(),
                "show_minute_hand": self.show_min_cb.isChecked(),
                "show_second_hand": self.show_second_cb.isChecked(),
                "show_second_tail": self.show_second_tail_cb.isChecked(),
                "hands_style": self.hands_style_combo.currentText(),
                "brand_text": self.brand_text.text(),
                "sub_text": self.sub_text.text()
            }
            with open(config_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print("Error saving config:", e)

    def closeEvent(self, event):
        self.save_settings()
        super().closeEvent(event)

    def on_theme_changed(self):
        theme = self.theme_combo.currentText()
        if theme == "Custom":
            return

        # Define colors/gradients for presets (Dial, Hands, Face, FaceOuter, UseGrad)
        themes = {
            "Classic Indigo":  ("#1e40af", "#dc2626", "#00000000", "#00000000", False),
            "Dark Minimalist": ("#e2e8f0", "#f8fafc", "#ff0f172a", "#ff1e293b", True),
            "Luxury Gold":     ("#d97706", "#b45309", "#ff292524", "#ff1c1917", True),
            "Emerald Premium": ("#047857", "#10b981", "#00000000", "#00000000", False),
            "Cyberpunk Neon":  ("#06b6d4", "#ec4899", "#ff0d0b21", "#ff05020c", True),
            "Soft Rose":       ("#be185d", "#db2777", "#fffff1f2", "#ffffe4e6", True)
        }

        dial_hex, hands_hex, face_hex, face_outer_hex, use_grad = themes[theme]
        self.color = QColor(dial_hex)
        self.hands_color = QColor(hands_hex)
        self.face_color = QColor(face_hex)
        self.face_grad_color = QColor(face_outer_hex)
        
        # Block signals temporarily
        self.use_gradient_cb.blockSignals(True)
        self.use_gradient_cb.setChecked(use_grad)
        self.use_gradient_cb.blockSignals(False)

        self.update_preview()

    def on_smooth_sweep_toggled(self):
        is_live = self.live_time_cb.isChecked()
        self.sound_cb.setEnabled(is_live and not self.smooth_sweep_cb.isChecked())
        if is_live:
            interval = 30 if self.smooth_sweep_cb.isChecked() else 1000
            self.timer.start(interval)
        self.update_preview()

    def on_live_time_toggled(self):
        is_live = self.live_time_cb.isChecked()
        self.hour_box.setEnabled(not is_live)
        self.min_box.setEnabled(not is_live)
        self.sec_box.setEnabled(not is_live)
        self.tz_box.setEnabled(is_live)
        self.smooth_sweep_cb.setEnabled(is_live)
        self.sound_cb.setEnabled(is_live and not self.smooth_sweep_cb.isChecked())
        if is_live:
            interval = 30 if self.smooth_sweep_cb.isChecked() else 1000
            self.timer.start(interval)
            self.sync_time_to_ui()
        else:
            self.timer.stop()
            self.update_preview()

    def play_tick(self):
        sec = int(getattr(self, "live_second", 0))
        if sec % 2 == 0:
            if hasattr(self, "tick_effect"):
                self.tick_effect.play()
        else:
            if hasattr(self, "tock_effect"):
                self.tock_effect.play()

    def sync_time_to_ui(self):
        dt = QDateTime.currentDateTimeUtc()
        offset_ms = int(self.tz_box.value() * 3600000)
        adjusted_dt = dt.addMSecs(offset_ms)
        t = adjusted_dt.time()

        ms = t.msec()
        self.live_second = t.second() + ms / 1000.0
        self.live_minute = t.minute() + self.live_second / 60.0
        self.live_hour = t.hour() + self.live_minute / 60.0

        current_sec_int = int(self.live_second)
        if current_sec_int != getattr(self, "last_sound_second", -1):
            self.last_sound_second = current_sec_int
            if self.sound_cb.isChecked() and not self.smooth_sweep_cb.isChecked():
                self.play_tick()

        self.hour_box.blockSignals(True)
        self.min_box.blockSignals(True)
        self.sec_box.blockSignals(True)

        self.hour_box.setValue(t.hour())
        self.min_box.setValue(t.minute())
        self.sec_box.setValue(t.second())

        self.hour_box.blockSignals(False)
        self.min_box.blockSignals(False)
        self.sec_box.blockSignals(False)

        self.update_preview()

    def on_live_timer_timeout(self):
        if self.live_time_cb.isChecked():
            self.sync_time_to_ui()

    def update_preview(self):
        font_family = self.font_combo.currentText() or self.vazir_family
        
        raw_digit = self.digit_combo.currentText()
        if "Persian" in raw_digit:
            digit_style = "Persian"
        elif "Roman" in raw_digit:
            digit_style = "Roman"
        else:
            digit_style = "English"

        if self.live_time_cb.isChecked() and self.smooth_sweep_cb.isChecked():
            hour_val = getattr(self, "live_hour", float(self.hour_box.value()))
            minute_val = getattr(self, "live_minute", float(self.min_box.value()))
            second_val = getattr(self, "live_second", float(self.sec_box.value()))
        else:
            hour_val = float(self.hour_box.value())
            minute_val = float(self.min_box.value())
            second_val = float(self.sec_box.value())

        img = make_clock_image(
            hour=hour_val,
            minute=minute_val,
            second=second_val,
            color=self.color,
            hands_color=self.hands_color,
            face_color=self.face_color,
            face_grad_color=self.face_grad_color,
            size_px=self.preview_size,
            font_family=font_family,
            show_hour=self.show_hour_cb.isChecked(),
            show_minute=self.show_min_cb.isChecked(),
            show_second=self.show_second_cb.isChecked(),
            digit_style=digit_style,
            show_ring=self.show_ring_cb.isChecked(),
            show_ticks=self.show_ticks_cb.isChecked(),
            show_numbers=self.show_numbers_cb.isChecked(),
            hands_style=self.hands_style_combo.currentText(),
            show_shadow=self.show_shadow_cb.isChecked(),
            tick_style=self.tick_style_combo.currentText(),
            use_gradient=self.use_gradient_cb.isChecked(),
            brand_text=self.brand_text.text(),
            sub_text=self.sub_text.text(),
            show_inner_ring=self.show_inner_ring_cb.isChecked(),
            double_ring=self.double_ring_cb.isChecked(),
            show_minute_ticks=self.show_minute_ticks_cb.isChecked(),
            show_second_tail=self.show_second_tail_cb.isChecked(),
            use_iiii=self.use_iiii_cb.isChecked()
        )
        
        # Composite checkerboard pattern for transparent preview area
        composite = QPixmap(self.preview_size, self.preview_size)
        painter = QPainter(composite)
        
        if self.show_checkerboard_cb.isChecked():
            tile_size = 12
            for y in range(0, self.preview_size, tile_size):
                for x in range(0, self.preview_size, tile_size):
                    color = QColor(230, 230, 230) if ((x // tile_size) + (y // tile_size)) % 2 == 0 else QColor(255, 255, 255)
                    painter.fillRect(x, y, tile_size, tile_size, color)
        else:
            # solid off-white background
            painter.fillRect(0, 0, self.preview_size, self.preview_size, QColor("#f5f5f7"))
            
        # Draw the transparent clock image
        painter.drawImage(0, 0, img)
        painter.end()
        
        self.preview_label.setPixmap(composite)
        self.save_settings()

    def choose_dial_color(self):
        c = QColorDialog.getColor(self.color, self, "Choose Dial Color", QColorDialog.ShowAlphaChannel)
        if c.isValid():
            self.color = c
            self.theme_combo.setCurrentText("Custom")
            self.update_preview()

    def choose_hands_color(self):
        c = QColorDialog.getColor(self.hands_color, self, "Choose Hands Color", QColorDialog.ShowAlphaChannel)
        if c.isValid():
            self.hands_color = c
            self.theme_combo.setCurrentText("Custom")
            self.update_preview()

    def choose_face_color(self):
        c = QColorDialog.getColor(self.face_color, self, "Choose Face Center Color", QColorDialog.ShowAlphaChannel)
        if c.isValid():
            self.face_color = c
            self.theme_combo.setCurrentText("Custom")
            self.update_preview()

    def choose_face_grad_color(self):
        c = QColorDialog.getColor(self.face_grad_color, self, "Choose Face Outer Color", QColorDialog.ShowAlphaChannel)
        if c.isValid():
            self.face_grad_color = c
            self.theme_combo.setCurrentText("Custom")
            self.update_preview()

    def copy_to_clipboard(self):
        size_px = self.size_box.value()
        font_family = self.font_combo.currentText() or self.vazir_family
        
        raw_digit = self.digit_combo.currentText()
        if "Persian" in raw_digit:
            digit_style = "Persian"
        elif "Roman" in raw_digit:
            digit_style = "Roman"
        else:
            digit_style = "English"

        if self.live_time_cb.isChecked() and self.smooth_sweep_cb.isChecked():
            hour_val = getattr(self, "live_hour", float(self.hour_box.value()))
            minute_val = getattr(self, "live_minute", float(self.min_box.value()))
            second_val = getattr(self, "live_second", float(self.sec_box.value()))
        else:
            hour_val = float(self.hour_box.value())
            minute_val = float(self.min_box.value())
            second_val = float(self.sec_box.value())

        img = make_clock_image(
            hour=hour_val,
            minute=minute_val,
            second=second_val,
            color=self.color,
            hands_color=self.hands_color,
            face_color=self.face_color,
            face_grad_color=self.face_grad_color,
            size_px=size_px,
            font_family=font_family,
            show_hour=self.show_hour_cb.isChecked(),
            show_minute=self.show_minute_cb.isChecked(),
            show_second=self.show_second_cb.isChecked(),
            digit_style=digit_style,
            show_ring=self.show_ring_cb.isChecked(),
            show_ticks=self.show_ticks_cb.isChecked(),
            show_numbers=self.show_numbers_cb.isChecked(),
            hands_style=self.hands_style_combo.currentText(),
            show_shadow=self.show_shadow_cb.isChecked(),
            tick_style=self.tick_style_combo.currentText(),
            use_gradient=self.use_gradient_cb.isChecked(),
            brand_text=self.brand_text.text(),
            sub_text=self.sub_text.text(),
            show_inner_ring=self.show_inner_ring_cb.isChecked(),
            double_ring=self.double_ring_cb.isChecked(),
            show_minute_ticks=self.show_minute_ticks_cb.isChecked(),
            show_second_tail=self.show_second_tail_cb.isChecked(),
            use_iiii=self.use_iiii_cb.isChecked()
        )
        QApplication.clipboard().setImage(img)
        
        self.copy_btn.setText("Copied!")
        QTimer.singleShot(1500, lambda: self.copy_btn.setText("Copy to Clipboard"))

    def save_png(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save PNG", "clock.png", "PNG Images (*.png)")
        if not path:
            return
        size_px = self.size_box.value()
        font_family = self.font_combo.currentText() or self.vazir_family
        
        raw_digit = self.digit_combo.currentText()
        if "Persian" in raw_digit:
            digit_style = "Persian"
        elif "Roman" in raw_digit:
            digit_style = "Roman"
        else:
            digit_style = "English"

        if self.live_time_cb.isChecked() and self.smooth_sweep_cb.isChecked():
            hour_val = getattr(self, "live_hour", float(self.hour_box.value()))
            minute_val = getattr(self, "live_minute", float(self.min_box.value()))
            second_val = getattr(self, "live_second", float(self.sec_box.value()))
        else:
            hour_val = float(self.hour_box.value())
            minute_val = float(self.min_box.value())
            second_val = float(self.sec_box.value())

        img = make_clock_image(
            hour=hour_val,
            minute=minute_val,
            second=second_val,
            color=self.color,
            hands_color=self.hands_color,
            face_color=self.face_color,
            face_grad_color=self.face_grad_color,
            size_px=size_px,
            font_family=font_family,
            show_hour=self.show_hour_cb.isChecked(),
            show_minute=self.show_min_cb.isChecked(),
            show_second=self.show_second_cb.isChecked(),
            digit_style=digit_style,
            show_ring=self.show_ring_cb.isChecked(),
            show_ticks=self.show_ticks_cb.isChecked(),
            show_numbers=self.show_numbers_cb.isChecked(),
            hands_style=self.hands_style_combo.currentText(),
            show_shadow=self.show_shadow_cb.isChecked(),
            tick_style=self.tick_style_combo.currentText(),
            use_gradient=self.use_gradient_cb.isChecked(),
            brand_text=self.brand_text.text(),
            sub_text=self.sub_text.text(),
            show_inner_ring=self.show_inner_ring_cb.isChecked(),
            double_ring=self.double_ring_cb.isChecked(),
            show_minute_ticks=self.show_minute_ticks_cb.isChecked(),
            show_second_tail=self.show_second_tail_cb.isChecked(),
            use_iiii=self.use_iiii_cb.isChecked()
        )
        img.save(path, "PNG")

    def save_svg(self):
        path, _ = QFileDialog.getSaveFileName(self, "Save SVG", "clock.svg", "SVG Images (*.svg)")
        if not path:
            return
        size_px = self.size_box.value()
        font_family = self.font_combo.currentText() or self.vazir_family
        
        raw_digit = self.digit_combo.currentText()
        if "Persian" in raw_digit:
            digit_style = "Persian"
        elif "Roman" in raw_digit:
            digit_style = "Roman"
        else:
            digit_style = "English"

        if self.live_time_cb.isChecked() and self.smooth_sweep_cb.isChecked():
            hour_val = getattr(self, "live_hour", float(self.hour_box.value()))
            minute_val = getattr(self, "live_minute", float(self.min_box.value()))
            second_val = getattr(self, "live_second", float(self.sec_box.value()))
        else:
            hour_val = float(self.hour_box.value())
            minute_val = float(self.min_box.value())
            second_val = float(self.sec_box.value())

        try:
            generator = QSvgGenerator()
            generator.setFileName(path)
            generator.setSize(QSize(size_px, size_px))
            generator.setViewBox(QRect(0, 0, size_px, size_px))
            generator.setTitle("Vazir Clock")
            generator.setDescription("Generated by Vazir Clock Designer")

            draw_clock_on_device(
                device=generator,
                hour=hour_val,
                minute=minute_val,
                second=second_val,
                color=self.color,
                hands_color=self.hands_color,
                face_color=self.face_color,
                face_grad_color=self.face_grad_color,
                size_px=size_px,
                font_family=font_family,
                show_hour=self.show_hour_cb.isChecked(),
                show_minute=self.show_minute_cb.isChecked(),
                show_second=self.show_second_cb.isChecked(),
                digit_style=digit_style,
                show_ring=self.show_ring_cb.isChecked(),
                show_ticks=self.show_ticks_cb.isChecked(),
                show_numbers=self.show_numbers_cb.isChecked(),
                hands_style=self.hands_style_combo.currentText(),
                show_shadow=self.show_shadow_cb.isChecked(),
                tick_style=self.tick_style_combo.currentText(),
                use_gradient=self.use_gradient_cb.isChecked(),
                brand_text=self.brand_text.text(),
                sub_text=self.sub_text.text(),
                show_inner_ring=self.show_inner_ring_cb.isChecked(),
                double_ring=self.double_ring_cb.isChecked(),
                show_minute_ticks=self.show_minute_ticks_cb.isChecked(),
                show_second_tail=self.show_second_tail_cb.isChecked(),
                use_iiii=self.use_iiii_cb.isChecked()
            )
        except Exception as e:
            print("Error saving SVG:", e)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    # Apply Segoe UI font globally
    app.setFont(QFont("Segoe UI", 9))
    w = ClockApp()
    w.show()
    sys.exit(app.exec_())
