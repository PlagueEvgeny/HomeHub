from flask import Flask, render_template
from flask_socketio import SocketIO, emit
import serial, serial.tools.list_ports, threading, time

app = Flask(__name__)
socketio = SocketIO(app, cors_allowed_origins="*")

usb_ser = None

@app.route("/")
def index():
    return render_template("index.html")

def list_usb_ports():
    return [p.device for p in serial.tools.list_ports.comports()
            if p.description and ("Arduino" in p.description or "USB" in p.description)]

def usb_reader(ser):
    while True:
        if ser is None or not ser.is_open:
            break
        try:
            line = ser.readline().decode("utf-8", errors="ignore").strip()
            if line:
                socketio.emit("sensor_data", line)
        except Exception as e:
            print(f"USB read error: {e}")
            break

@socketio.on("select_port")
def select_port(port_name):
    global usb_ser
    try:
        if usb_ser and usb_ser.is_open:
            usb_ser.close()
        usb_ser = serial.Serial(port_name, 9600, timeout=1)
        time.sleep(2)
        if usb_ser.is_open:
            threading.Thread(target=usb_reader, args=(usb_ser,), daemon=True).start()
            emit("usb_connected", f"USB подключен: {port_name}")
        else:
            emit("usb_connected", f"Не удалось открыть {port_name}")
    except Exception as e:
        emit("usb_connected", f"USB ошибка: {e}")

@socketio.on("disconnect_usb")
def disconnect_usb():
    global usb_ser
    if usb_ser and usb_ser.is_open:
        usb_ser.close()
        usb_ser = None
        emit("usb_disconnected", "USB порт отключен")

@socketio.on("command")
def handle_command(cmd):
    global usb_ser
    if usb_ser and usb_ser.is_open:
        try:
            usb_ser.write((cmd+"\n").encode())
        except Exception as e:
            print(f"USB write error: {e}")

@socketio.on("connect")
def handle_connect():
    emit("ports", list_usb_ports())

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=5000)
