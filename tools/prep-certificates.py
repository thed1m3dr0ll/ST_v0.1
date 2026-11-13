# Готовит сертификаты компании из папки «для сайта/сертификаты» для блока сертификатов на странице «Партнерам».
# JPEG — просто пересохраняем, PDF — отрисовываем первую страницу вместе с заполненными полями
# (номер, название организации, дата — это поля формы, без них сертификат выглядит пустым бланком).
# Результат — src/assets/company-certificates/<имя файла>.jpg (по длинной стороне не больше 2000 px).
#
# Запуск из папки site:  python tools/prep-certificates.py
# Нужны пакеты:          python -m pip install pypdfium2 pillow
# Новый сертификат: положите файл в «для сайта/сертификаты», запустите скрипт, затем в админке
# /admin/ → «Настройки сайта» → «Сертификаты» добавьте пункт и выберите получившуюся картинку.
import os
import pypdfium2 as pdfium
from PIL import Image

SITE = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
SRC = os.path.join(SITE, '..', 'для сайта', 'сертификаты')
OUT = os.path.join(SITE, 'src', 'assets', 'company-certificates')
MAX = 2000

# Имена файлов на выходе — латиницей, чтобы их было удобно импортировать.
NAMES = {
    'Сертификат AGC1.jpeg': 'agc.jpg',
    'Сертификат Дилера1.jpeg': 'alutech-dealer.jpg',
    'Сертификат Райко1.jpeg': 'raico.jpg',
    'Сертификат_АТ_1278_26_Стекляника, ООО, Нижний Новгород_save.pdf': 'alutech-at-1278.jpg',
    'Сертификат_ТР_486_26_Стекляника, ООО, Нижний Новгород_save.pdf': 'alutech-tr-486.jpg',
    'Сертификат_ТР_487_26_Стекляника, ООО, Нижний Новгород_save.pdf': 'alutech-tr-487.jpg',
    'Сертификат_ТР_488_26_Стекляника, ООО, Нижний Новгород_save.pdf': 'alutech-tr-488.jpg',
}

os.makedirs(OUT, exist_ok=True)
for name in sorted(os.listdir(SRC)):
    src = os.path.join(SRC, name)
    out = NAMES.get(name) or os.path.splitext(name)[0] + '.jpg'
    if name.lower().endswith('.pdf'):
        pdf = pdfium.PdfDocument(src)
        pdf.init_forms()
        page = pdf[0]
        img = page.render(scale=MAX / max(page.get_size()), may_draw_forms=True).to_pil()
    elif name.lower().endswith(('.jpg', '.jpeg', '.png', '.webp')):
        img = Image.open(src)
        img.thumbnail((MAX, MAX))
    else:
        continue
    img.convert('RGB').save(os.path.join(OUT, out), quality=86, optimize=True)
    print(f'{name} -> {out} {img.size}')
