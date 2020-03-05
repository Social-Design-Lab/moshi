from flask import Flask, request, jsonify
from runtime import SmartReplyRuntime
from flask_cors import CORS

model = SmartReplyRuntime()
app = Flask("__main__")
CORS(app, supports_credentials=True)


@app.route("/api/inference", methods = ['POST'])

def inference():
    data = request.get_json()
    if not 'input' in data :
        response = HttpResponse(jsonify({
            "success" : False,
            "message" : "Invalid JSON, key input not found"
        }))
        response.__setitem__("Content-type", "application/json")
        response.__setitem__("Access-Control-Allow-Origin", "*")
        return response
    
    if type(data['input']) == list :
        result =  model.predictMultiple(data['input'])
        # result.headers.add('Access-Control-Allow-Origin', '*')
        response = HttpRequest(jsonify({
            "success" : True,
            "result" : result
        }))
        response.__setitem__("Content-type", "application/json")
        response.__setitem__("Access-Control-Allow-Origin", "*")
        return response
    
    if type(data['input']) == str :
        result = model.predict(data['input'])
        result.headers.add('Access-Control-Allow-Origin', '*')
        response = HttpRequest(jsonify({
            "success" : True,
            "result" : result
        }))
        return response
    
    response = HttpRequest(jsonify({
        "success" : False,
        "result" : "Invalid result"
    }))
    return response


app.run()