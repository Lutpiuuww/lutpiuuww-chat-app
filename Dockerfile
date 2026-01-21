# Gunakan Python versi stabil
FROM python:3.9

# Buat folder kerja di dalam server
WORKDIR /code

# Copy file requirements dulu biar hemat waktu download
COPY ./requirements.txt /code/requirements.txt

# Install library (FastAPI, Uvicorn, dll)
RUN pip install --no-cache-dir --upgrade -r /code/requirements.txt

# Copy semua kodingan kamu ke server
COPY . /code

# Beri izin folder upload (PENTING biar bisa upload gambar)
RUN mkdir -p /code/uploads && chmod 777 /code/uploads

# Nyalakan server di port 7860 (Port wajib Hugging Face)
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "7860"]