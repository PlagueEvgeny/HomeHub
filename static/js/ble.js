let characteristic;

document.getElementById('connectBLE').onclick = async () => {
    const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: "HM" }],
        optionalServices: ['0000ffe0-0000-1000-8000-00805f9b34fb']
    });
    const server = await device.gatt.connect();
    const service = await server.getPrimaryService('0000ffe0-0000-1000-8000-00805f9b34fb');
    characteristic = await service.getCharacteristic('0000ffe1-0000-1000-8000-00805f9b34fb');

    await characteristic.startNotifications();
    characteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = new TextDecoder().decode(event.target.value);
        console.log('Received (BLE):', value);
    });
};

function send(cmd){
    if(!characteristic) return;
    characteristic.writeValue(new TextEncoder().encode(cmd));
}

function setServo(angle){ send("SERVO:" + angle); }
