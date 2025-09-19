const socket = io();
const sensorLog = document.getElementById("sensorLog");
const usbLog = document.getElementById("usbLog");
const rulesLog = document.getElementById("rulesLog");

const tempValue = document.getElementById("tempValue");
const humValue = document.getElementById("humValue");
const ldrValue = document.getElementById("ldrValue");

const pirIndicator = document.getElementById("pirIndicator");
const reedIndicator = document.getElementById("reedIndicator");
const buttonIndicator = document.getElementById("buttonIndicator");

const ledIndicator = document.getElementById("ledIndicator");
const buzzerIndicator = document.getElementById("buzzerIndicator");
const servoAngle = document.getElementById("servoAngle");

function send(cmd){
    socket.emit("command", cmd);
    if(cmd.includes("LED_ON")) ledIndicator.style.background = "green";
    if(cmd.includes("LED_OFF")) ledIndicator.style.background = "red";
    if(cmd.includes("BUZZER_ON")) buzzerIndicator.style.background = "green";
    if(cmd.includes("BUZZER_OFF")) buzzerIndicator.style.background = "red";
}
function setServo(angle){
    send("SERVO:" + angle);
    servoAngle.innerText = angle;
}

function connectPort(){
    const port = document.getElementById("portSelect").value;
    socket.emit("select_port", port);
}
function disconnectUSB(){
    socket.emit("disconnect_usb");
}

function addRule(){
    const sensor = document.getElementById("ruleSensor").value;
    const condition = document.getElementById("ruleCondition").value;
    const command = document.getElementById("ruleCommand").value;
    if(sensor && condition && command){
        socket.emit("add_rule", {sensor, condition, command});
        rulesLog.innerText += `Правило: ${sensor} ${condition} → ${command}\n`;
        rulesLog.scrollTop = rulesLog.scrollHeight;
    }
}

// USB статус
socket.on("usb_connected", msg=>{
    usbLog.innerText += msg + "\n";
    usbLog.scrollTop = usbLog.scrollHeight;
    document.getElementById("usbStatus").innerText = "Статус: подключено";
});
socket.on("usb_disconnected", msg=>{
    usbLog.innerText += msg + "\n";
    usbLog.scrollTop = usbLog.scrollHeight;
    document.getElementById("usbStatus").innerText = "Статус: отключено";
});

// Датчики и график
let chartData = {
    labels: [],
    datasets: [
        { label:"Темп (°C)", data:[], borderColor:"red", fill:false },
        { label:"Влажность (%)", data:[], borderColor:"blue", fill:false },
        { label:"Освещённость", data:[], borderColor:"orange", fill:false }
    ]
};
const ctx = document.getElementById("sensorChart").getContext("2d");
const sensorChart = new Chart(ctx, { type:"line", data:chartData, options:{ responsive:true }});

socket.on("sensor_data", msg=>{
    sensorLog.innerText += msg + "\n";
    sensorLog.scrollTop = sensorLog.scrollHeight;

    // Разбор данных
    let temp = msg.match(/T([\d.]+)/);
    let hum = msg.match(/H([\d.]+)/);
    let ldr = msg.match(/LDR:(\d+)/);
    let pir = msg.match(/PIR:(\d+)/);
    let reed = msg.match(/REED:(\d+)/);
    let btn = msg.match(/BUTTON:(\d+)/);

    if(temp) tempValue.innerText = temp[1];
    if(hum) humValue.innerText = hum[1];
    if(ldr) ldrValue.innerText = ldr[1];

    pirIndicator.style.background = (pir && pir[1]=="1") ? "green":"red";
    reedIndicator.style.background = (reed && reed[1]=="1") ? "green":"red";
    buttonIndicator.style.background = (btn && btn[1]=="0") ? "green":"red"; // кнопка pull-up

    // Обновление графика
    if(temp && hum && ldr){
        chartData.labels.push("");
        chartData.datasets[0].data.push(parseFloat(temp[1]));
        chartData.datasets[1].data.push(parseFloat(hum[1]));
        chartData.datasets[2].data.push(parseInt(ldr[1]));

        if(chartData.labels.length>30){
            chartData.labels.shift();
            chartData.datasets.forEach(ds => ds.data.shift());
        }
        sensorChart.update();
    }
});

// Список USB портов
socket.on("ports", list=>{
    const sel = document.getElementById("portSelect");
    sel.innerHTML = "";
    list.forEach(p=>{
        const opt = document.createElement("option");
        opt.value=p; opt.innerText=p;
        sel.appendChild(opt);
    });
});
