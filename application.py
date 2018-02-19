import sqlite3
import backend

from flask import Flask, request, jsonify
from flask_cors import CORS
from classutil.class_decoders import ClassDecoder
from settings import DATABASE_PATH

db_connection = sqlite3.connect(DATABASE_PATH)
db_cursor = db_connection.cursor()

application = Flask(__name__)
CORS(application)


@application.route('/data', methods=['POST'])
def return_db_data():
    classes = request.json['classes']
    ret_classes = [backend.generate_class_versions(i) for i in classes]

    cd = ClassDecoder()
    ret_dict = {}
    index = 0
    for cl_list in ret_classes:
        temp_list = []
        for cl in cl_list:
            temp_list.append(cd.default(cl))
        ret_dict[classes[index]] = temp_list
        index += 1
    return jsonify(ret_dict)


@application.route('/department', methods={'POST'})
def return_department_list():
    departments = backend.get_departments()
    return jsonify(departments)


@application.route('/classes', methods={'POST'})
def return_classes():
    department = request.args.get('department')
    classes = backend.get_classes_in_department(department)
    return jsonify(classes)


if __name__ == '__main__':
    application.debug = True
    application.run()