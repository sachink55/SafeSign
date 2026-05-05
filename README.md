# SafeSign: AI-Powered Signature Verification System

SafeSign is a modern, full-stack banking application designed to automate and secure the process of signature verification using Deep Learning. It features a high-end fintech UI with glassmorphism aesthetics and a Siamese Neural Network for real-time signature matching.

## 🚀 Features

- **User Registration & Login**: Secure authentication with role-based access (User/Admin).
- **Signature Enrollment**: Users can upload their official signature during registration.
- **Admin Dashboard**: A powerful interface for administrators to manage users and verify signatures.
- **AI-Powered Verification**: Real-time signature matching using a Siamese Triplet Network to detect forgeries.
- **Bank Management**: Basic banking operations like balance tracking and account type management.
- **Modern UI**: Fully responsive, dark-themed interface built with React and Tailwind CSS.

## 🛠️ Tech Stack

- **Frontend**: React.js, Vite, Lucide React (Icons).
- **Backend**: Node.js, Express.js.
- **Database**: MongoDB Atlas (Mongoose).
- **Machine Learning**: Python, TensorFlow/Keras, OpenCV.
- **Cloud Storage**: Cloudinary (for storing signature images).

## 📋 Prerequisites

Before running the project, ensure you have the following installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Python 3.10+](https://www.python.org/)
- [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) account (or local MongoDB)
- [Cloudinary](https://cloudinary.com/) account

## ⚙️ Setup & Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd SafeSign
```

### 2. Install Dependencies
**Frontend & Backend (Node.js):**
```bash
npm install
```

**Machine Learning (Python):**
It is recommended to use a virtual environment:
```bash
# Create virtual environment
python -m venv myenv

# Activate it (Windows)
myenv\Scripts\activate

# Install requirements
pip install -r requirements.txt
```

### 3. Environment Variables
Create a `.env` file in the root directory and add the following:
```env
PORT=5005
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

## 🏃 How to Run

To run the application from VS Code, follow these steps:

### Option A: Manual Terminals (Recommended)

1. **Start the Backend Server**:
   Open a new terminal in VS Code and run:
   ```bash
   npm run server
   ```
   *The server will start on `http://localhost:5005`*

2. **Start the Frontend Development Server**:
   Open a **second** terminal and run:
   ```bash
   npm run dev
   ```
   *The frontend will be available at `http://localhost:5173`*

### Option B: One-Command Execution (if using a runner)
If you want to run both simultaneously, you can install `concurrently`:
`npm install concurrently --save-dev` and add a script to `package.json`:
`"start": "concurrently \"npm run server\" \"npm run dev\""`

## 🧠 Model Information
The signature verification model is located in the `model/` folder. It uses a Siamese architecture to calculate the Euclidean distance between a registered signature and a test signature.
- **Threshold**: The default distance threshold is set to `0.8`. Distances below this value are considered "Matched".
- **Execution**: The backend calls the Python script `app/backend/predict.py` using the Python executable located in `myenv/`.

## 🤝 Contributing
Contributions are welcome! Please fork the repository and create a pull request.