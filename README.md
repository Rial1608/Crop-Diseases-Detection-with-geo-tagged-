# 🌾 Smart Crop Disease Detection System (Geo-Tagged)

## 📌 Overview
The **Smart Crop Disease Detection System** is an AI-powered web application designed to identify crop diseases using image classification and provide location-based insights using geo-tagging.

This system helps farmers, researchers, and agricultural experts detect plant diseases early and take preventive actions, improving crop yield and reducing losses.

---

## 🚀 Features

- 🌿 Crop Disease Detection using Deep Learning (CNN / TensorFlow)
- 📸 Image Upload & Analysis
- 📍 Geo-Tagging Integration
  - Detects user location
  - Associates disease reports with geographical data
- 🌦️ Weather Data Integration
- 📊 Detailed Disease Report
  - Disease name
  - Confidence score
  - Recommended actions
- 🌙 Dark Mode UI
- 📄 Downloadable PDF Reports

---

## 🧠 Technologies Used

### Frontend:
- HTML, CSS, JavaScript
- Tailwind CSS

### Backend:
- Python
- FastAPI

### Machine Learning:
- TensorFlow / Keras
- CNN (Convolutional Neural Network)

### Other Integrations:
- Geo-location API
- Weather API

---

## 📂 Project Structure

- Crop-Disease-Detection/
-│
-├──  backend/
-│ ├── model/
│ │ ├── model.keras
│ │ └── class_indices.json
│ ├── main.py
│ └── utils/
│
├── frontend/
│ ├── index.html
│ ├── styles.css
│ └── scripts.js
│
├── README.md
└── requirements.txt


---

## ⚙️ Installation & Setup

### 1. Clone the Repository
```
git clone https://github.com/your-username/crop-disease-detection.git
cd crop-disease-detection
```

### 2. Install Dependencies
```
pip install -r requirements.txt
```
### 3. Run Backend Server
```
uvicorn main:app --reload
```

### 4. Open in Browser
```
http://localhost:8000
```

---

## 🧪 Model Details

- Model Type: CNN (Convolutional Neural Network)
- Framework: TensorFlow / Keras
- Input: Leaf Image
- Output: Disease Class + Confidence Score

---

## 📍 Geo-Tagging Functionality

- Captures user's real-time location
- Associates disease detection with coordinates
- Helps in:
  - Disease tracking by region
  - Smart agriculture analysis

---

## 📸 How It Works

1. Upload crop image  
2. System processes image using trained model  
3. Detects disease  
4. Fetches location & weather data  
5. Displays results with recommendations  

---

## ⚠️ Important Notice

🚫 **This project is NOT free to use.**

All rights are strictly reserved by the owner.

- Unauthorized copying, distribution, or commercial use is prohibited  
- Permission is required before using this project in any form  

---

## 📜 License

**All Rights Reserved © 2026**

This project and its codebase are proprietary.

---

## 👨‍💻 Author

Developed by: **Ritik Sharma**

---

## 💡 Future Enhancements

- Mobile App Integration  
- Real-time disease mapping  
- Multi-language support  
- More crop datasets  

---

## ⭐ Support

If you like this project, consider giving it a ⭐ on GitHub!
