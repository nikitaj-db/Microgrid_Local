import asyncio
import websockets
import json
import urllib.request
import urllib.error

# Backend REST base URLs (Solar + Genset) - add your actual IP/port if different.
BASEURL = "http://localhost:5002/micro/live"
SOLAR_URL = f"{BASEURL}/solar"
GENSET_URL = f"{BASEURL}/genset"

def post_json(url, payload):
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=2) as resp:
            return resp.status
    except (urllib.error.URLError, urllib.error.HTTPError) as e:
        return None

async def send_periodically(websocket):
    data_1 = {
        "source": "python",
        "status": {
            "start_stop": 0,
            "auto_manual": 2,
            "breakeropen_close": 3,
            "reset": 0
        },
        "data":   {     
        "main_voltage_ry": 50,
        "main_voltage_yb": 50,
        "main_voltage_rb": 50,
        "frequency": 50,
        "phase_angle": 50,
        "createdlocal_db": "2024-08-26T10:59:24.361Z",
        "updatedlocal_db": "2024-08-26T10:59:24.361Z",
        "alternator_voltage": 9.2,
        "alternator_current": 250,
        "power_factor": -0.27,
        "kilowatt_hour": 10,
        "frequency": 92,
        "avg_kw": 10,
        "avg_kva": 10,
        "avg_kvar": 10,
        "voltage": {
        "ry" : 410,
        "yb" : 410, 
        "rb": 410
        },
        "apparent_power": {
        "ry" : 410,
        "yb" : 410, 
        "rb": 410
        },
        "energy_chart": {
        "kvah" : 40, 
        "Kvarh" : 12
        },
        "active_power": {
        "ry" : 410,
        "yb" : 410, 
        "rb": 410
        },
        "reactive_power": {
        "ry" : 410,
        "yb" : 410, 
        "rb": 410
        },
        "current": {
        "r" : 410, 
        "y" : 410, 
        "b": 410,
        "n": 410
        },
        "power_factor_ryb": {
        "r" : 410, 
        "y" : 410, 
        "b": 410,
        "n": 410
        },
        "sync": 0,
        "sync_degree": 90,
        "sync_voltage": 9.2,
        "sync_frequency": 92,
        "avg_power_kva": 41,
        "avg_power_kw": 35,
        "avg_power_kvahr": 64,
        "voltage": 40,
        "frequency": 65,
        "power_factor": "-0.32",
        "total_kw": 64,
        "running_time": 16,
        "engine_speed": 1500,
        "battery_voltage": 9.2,
        "lube_oil_pressure": 25.5,
        "coolant_temperature": 50.5,
        "canopy_temperature": 123.5,
        "fuel_temperature": 50.1,
        "exhaust_temperature": 45.4,
        "lube_oil_temperature": 50.5,
        "manifold_temperature": 50.7,
        "manifold_pressure": 10,
        "turbo_speed": 10,
        "fuel_level": 10,
        "shutdowns": 10,
        "warnings": 10,
        "maintainance_last_date": "2024-08-09 10:19",
        "maintainance_next_date": "2024-08-10 10:19",
        "maintainance_time_left": 600, 
        "maintainance_running_time": 600,
        "createdlocal_db": "2024-08-26T10:59:24.361Z",
        "updatedlocal_db": "2024-08-26T10:59:24.361Z",
        "avg_voltage_pn": 230,
        "avg_voltage_pp": 400,
        "avg_power_kva": 50,
        "avg_power_pw": 45,
        "frequency": 50,
        "power_factor": "0.8",
        "total_working_capacity": 10000,
        "running_time": 120,
        "fuel_level": 70,
        "loads": 80,
        "coolant_temp": "75.5",
        "engine_speed": 1500,
        "alternator_voltage": 230,
        "lube_oil_pressure": "5.5",
        "alternator_current": 100,
        "battery_voltage": "12.5",
        "shutdowns": 1,
        "warnings": 0,
        }
    }
    data = {
        "source": "python",
        "status": {
            "start_stop": 0,
            "auto_manual": 2,
            "breakeropen_close": 3,
            "reset": 0
        },
        "data": {
            "power_factor": "0.8",
            "total_working_capacity": 10000,
            "running_time": 120,
            "fuel_level": 70,
            "loads": 80,
            "coolant_temp": "75.5",
            "engine_speed": 1500,
            "alternator_voltage": 230,
            "lube_oil_pressure": "5.5"
        }
    }
    while True:
        await asyncio.sleep(0.5)
        # Send latest values to backend (no DB needed). Frontend reads `/micro/live/...`.
        # Post full envelope; backend will normalize keys from `data_1["data"]`.
        post_json(SOLAR_URL, data_1)
        post_json(GENSET_URL, data_1)
        await websocket.send(json.dumps(data_1))
        print("Sent message")
        print(data_1)
        print("----->>><<<-----")
        await asyncio.sleep(1)

async def receive_forever(websocket):
    try:
        while True:
            print("----->>><<<-----RRRRR")
            msg = await websocket.recv()
            print("Received:", msg)
            print("----->>><<<-----RRRRR")
    except websockets.ConnectionClosed:
        print("Connection closed by server")

async def websocket_handler():
    uri = "ws://localhost:5000"
    async with websockets.connect(uri) as websocket:
        print("Connected to WebSocket server")

        await send_periodically(websocket)

        # Start sending and receiving in parallel
        send_task = asyncio.create_task(send_periodically(websocket))
        receive_task = asyncio.create_task(receive_forever(websocket))

        # Wait until one of them finishes (or crashes)
        await asyncio.gather(send_task, receive_task)
        await asyncio.gather(receive_task)

asyncio.run(websocket_handler())
