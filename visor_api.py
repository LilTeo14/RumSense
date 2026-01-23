#este archivo sirve para ver si la api esta funcionando correctamente

import socket
import json

# Configuración (Misma que pusiste en uBeacon Tool)
UDP_IP = "127.0.0.1" 
UDP_PORT = 5000

# Creamos el socket UDP
sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)

try:
    # "Atamos" el socket al puerto para escuchar
    sock.bind((UDP_IP, UDP_PORT))
    print(f"👀 ESCUCHANDO API UBEACON EN {UDP_IP}:{UDP_PORT}")
    print("Mueve un Tag para ver los datos caer... (Ctrl+C para salir)")
    print("-" * 40)

    while True:
        # Recibir datos (buffer de 4096 bytes es suficiente para JSONs pequeños)
        data, addr = sock.recvfrom(4096)
        
        try:
            # Decodificar bytes a texto y luego a JSON bonito
            mensaje_texto = data.decode('utf-8')
            mensaje_json = json.loads(mensaje_texto)
            
            # Imprimir con formato (indentación) para leerlo bien
            print(json.dumps(mensaje_json, indent=4))
            print("-" * 20)
            
        except json.JSONDecodeError:
            print(f"⚠️ Recibido dato no-JSON: {data}")
        except Exception as e:
            print(f"❌ Error: {e}")

except OSError:
    print(f"❌ ERROR: El puerto {UDP_PORT} ya está ocupado.")
    print("Asegúrate de no tener otro script corriendo que use el mismo puerto.")
except KeyboardInterrupt:
    print("\n👋 Cerrando visor.")
finally:
    sock.close()