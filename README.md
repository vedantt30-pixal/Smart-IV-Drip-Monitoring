# 💉 IV Drip Monitoring System Dashboard

This project presents a Smart IV Drip Monitoring System that combines embedded hardware and web technologies to automate intravenous fluid monitoring. The system uses copper strips for multi-level fluid detection, an IR count slot sensor for drip counting, and an IR LED-transmitter pair positioned across the IV pipe for air bubble detection. An ESP32 microcontroller collects sensor data and sends it to a web-based dashboard for real-time visualization and alerts. To ensure uninterrupted monitoring, the system incorporates SD card storage as a fail-safe mechanism. If Wi-Fi connectivity is lost, data is logged locally and can be used by the system until network communication is restored, improving reliability in critical healthcare environments.
  
 *<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/6c94bdad-0f56-49bc-9f31-0f90e69d889f" />*

## 📖 Overview

The IV Drip Monitoring System is designed to automate the monitoring of intravenous fluid levels in hospitals and healthcare facilities. Traditional IV monitoring requires continuous manual supervision, which can lead to delayed responses and interruptions in patient treatment.

This project provides a digital solution by integrating hardware sensors with a web-based dashboard. The hardware continuously measures IV fluid levels and transmits data to the server, where it is processed and displayed through an intuitive user interface.

## 🚀 Features

* Real-time IV fluid level monitoring
* Automated low-level alerts and notifications
* Interactive web dashboard
* Remote patient monitoring
* Sensor data visualization
* Live status updates
* Responsive user interface
* IoT device integration

## 🏗️ System Architecture

```text
IV Drip Bottle
      │
      ▼
Level Sensor
      │
      ▼
Microcontroller (ESP32/Arduino)
      │
      ▼
Backend Server (Node.js)
      │
      ▼
Database
      │
      ▼
Web Dashboard
      │
      ▼
Healthcare Staff
```

## 🛠️ Technologies Used

### Frontend

* HTML5
* CSS3
* JavaScript

### Backend

* Node.js
* Express.js

### Database

* MongoDB

### Hardware

* ESP32 
* IR Count Slot Sensor
* IR LED and Transmitter
* Copper strips
* SD Card

## 📂 Project Structure

```bash
ivproject/
│
├── backend/
├── server.js
├── package.json
├── package-lock.json
├── iv_drip_dashboard_v4.html
└── README.md
```

## ⚙️ Installation

### Clone the Repository

```bash
git clone https://github.com/your-username/iv-drip-monitoring-system.git
cd iv-drip-monitoring-system
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
```

### Start the Server

```bash
nodemon server.js
```

## 📊 Dashboard Functions

* Displays current IV fluid level
* Shows system status in real time
* Generates low-level warnings
* Provides remote monitoring access
* Maintains continuous data updates
* Notifications and buzzer in abnormal cases

## 🎯 Objectives

* Reduce manual monitoring efforts
* Improve patient safety
* Prevent IV fluid depletion
* Enable remote healthcare supervision
* Support smart healthcare infrastructure

## 🔮 Future Enhancements

* Mobile application integration
* Patient management module
* Cloud deployment
* Advanced analytics dashboard
* AI-based fluid consumption prediction

## 👨‍💻 Author

**Abeer Sharif**
Electronics and Computer science student

*An IoT-based healthcare solution that combines embedded hardware and web technologies to improve patient care through automated IV drip monitoring.*
