# دليل تشغيل Containers منفصلة بدون Docker Compose

هذا الدليل يشرح كيفية تشغيل كل container لوحده وربطهم مع بعض عن طريق Docker network يدوي.

## الخطوة 1️⃣: إنشاء Docker Network

أول حاجة، نعمل network مخصوص للتطبيق:

```bash
docker network create tazkarty-network
```

للتحقق من أن الـ network اتعمل بنجاح:

```bash
docker network ls
```

---

## الخطوة 2️⃣: تشغيل MongoDB Container

```bash
docker run -d `
  --name tazkarty-mongodb `
  --network tazkarty-network `
  -p 27017:27017 `
  -v mongo_data:/data/db `
  --restart unless-stopped `
  mongo:6
```

### شرح الأوامر:
- `-d`: تشغيل الـ container في الخلفية
- `--name`: تسمية الـ container
- `--network`: ربط الـ container بالـ network اللي عملناه
- `-p 27017:27017`: فتح port للوصول من الخارج
- `-v mongo_data:/data/db`: حفظ البيانات في volume دائم
- `--restart unless-stopped`: إعادة التشغيل تلقائياً

---

## الخطوة 3️⃣: تشغيل Backend Container

> **ملحوظة مهمة:** تأكد أن ملف `.env` موجود في مجلد `backend`

```bash
docker run -d `
  --name tazkarty-backend `
  --network tazkarty-network `
  -p 5000:5000 `
  --env-file ./backend/.env `
  -e PORT=5000 `
  -e MONGO_URI=mongodb://tazkarty-mongodb:27017/tazkarty `
  --restart unless-stopped `
  ziadnader1/tazkarty-backend:latest
```

### شرح الإضافات:
- `--env-file`: تحميل متغيرات البيئة من ملف `.env`
- `-e MONGO_URI=...`: ملاحظة استخدام `tazkarty-mongodb` (اسم الـ container) بدلاً من `localhost`

---

## الخطوة 4️⃣: تشغيل Frontend Container

```bash
docker run -d `
  --name tazkarty-frontend `
  --network tazkarty-network `
  -p 4200:80 `
  --restart unless-stopped `
  ziadnader1/tazkarty-frontend:latest
```

---

## التحقق من الـ Containers 🔍

### عرض كل الـ containers الشغالة:
```bash
docker ps
```

### عرض الـ containers المتصلة بالـ network:
```bash
docker network inspect tazkarty-network
```

### عرض logs لأي container:
```bash
docker logs tazkarty-backend
docker logs tazkarty-frontend
docker logs tazkarty-mongodb
```

---

## إيقاف وحذف الـ Containers 🛑

### إيقاف وحذف container معين:
```bash
docker stop tazkarty-backend
docker rm tazkarty-backend
```

### إيقاف وحذف جميع الـ containers:
```bash
docker stop tazkarty-mongodb tazkarty-backend tazkarty-frontend
docker rm tazkarty-mongodb tazkarty-backend tazkarty-frontend
```

### حذف الـ network (بعد إيقاف كل الـ containers):
```bash
docker network rm tazkarty-network
```

---

## إعادة التشغيل 🔄

إذا أوقفت الـ containers وعايز تشغلهم تاني بدون إعادة تعريف كل حاجة:

```bash
docker start tazkarty-mongodb
docker start tazkarty-backend
docker start tazkarty-frontend
```

---

## الوصول للتطبيق 🌐

بعد تشغيل كل الـ containers:

- **Frontend**: [http://localhost:4200](http://localhost:4200)
- **Backend API**: [http://localhost:5000](http://localhost:5000)
- **MongoDB**: `mongodb://localhost:27017`

---

## ملاحظات مهمة ⚠️

1. **ترتيب التشغيل**: يُفضل تشغيل MongoDB أولاً، ثم Backend، ثم Frontend
2. **الـ Network**: كل الـ containers لازم تكون على نفس الـ network عشان يتواصلوا مع بعض
3. **الـ Volumes**: الـ volume `mongo_data` بيتعمل تلقائياً لحفظ بيانات MongoDB
4. **البيئة**: تأكد أن ملف `backend/.env` موجود وفيه كل المتغيرات المطلوبة

---

## استكشاف الأخطاء 🔧

### لو الـ Backend مش قادر يتصل بالـ MongoDB:

```bash
# تحقق أن الـ containers على نفس الـ network
docker network inspect tazkarty-network

# تحقق من logs الـ backend
docker logs tazkarty-backend
```

### لو عايز تدخل داخل container معين:

```bash
docker exec -it tazkarty-backend sh
docker exec -it tazkarty-mongodb mongosh
```

---

## Script لتشغيل كل حاجة مرة واحدة 🚀

يمكنك حفظ هذا في ملف `start-containers.ps1`:

```powershell
# إنشاء الـ network
docker network create tazkarty-network 2>$null

# تشغيل MongoDB
docker run -d `
  --name tazkarty-mongodb `
  --network tazkarty-network `
  -p 27017:27017 `
  -v mongo_data:/data/db `
  --restart unless-stopped `
  mongo:6

# انتظار MongoDB للتشغيل
Write-Host "Waiting for MongoDB to start..."
Start-Sleep -Seconds 5

# تشغيل Backend
docker run -d `
  --name tazkarty-backend `
  --network tazkarty-network `
  -p 5000:5000 `
  --env-file ./backend/.env `
  -e PORT=5000 `
  -e MONGO_URI=mongodb://tazkarty-mongodb:27017/tazkarty `
  --restart unless-stopped `
  ziadnader1/tazkarty-backend:latest

# انتظار Backend للتشغيل
Write-Host "Waiting for Backend to start..."
Start-Sleep -Seconds 5

# تشغيل Frontend
docker run -d `
  --name tazkarty-frontend `
  --network tazkarty-network `
  -p 4200:80 `
  --restart unless-stopped `
  ziadnader1/tazkarty-frontend:latest

Write-Host "All containers are running!"
docker ps
```

وscript لإيقاف كل حاجة في ملف `stop-containers.ps1`:

```powershell
# إيقاف وحذف الـ containers
docker stop tazkarty-mongodb tazkarty-backend tazkarty-frontend 2>$null
docker rm tazkarty-mongodb tazkarty-backend tazkarty-frontend 2>$null

Write-Host "All containers stopped and removed!"
```
