import os
import sqlite3

from classutil.classutils import *
from settings import DATABASE_PATH, HOME_DIR

"""
Picks classes and autogenerates schedules.
"""  # Initializing database

os.chdir(HOME_DIR)
database = sqlite3.connect(DATABASE_PATH, check_same_thread=False)
database.row_factory = sqlite3.Row
cursor = database.cursor()
departments = []


def get_classes_in_department(department):
    # Must order this one separately because doing it lexically won't work
    cursor.execute("SELECT DISTINCT COURSE_NUM FROM CLASS_LEGEND WHERE DEPARTMENT = ?", (department,))
    return [dict(row) for row in cursor.fetchall()]


def get_departments():
    global departments
    if not departments:
        cursor.execute("SELECT DISTINCT DEPT_CODE FROM DEPARTMENT ORDER BY DEPT_CODE")
        departments = [dict(row) for row in cursor.fetchall()]
    return departments


def generate_class_versions(class_id):
    """
    Generates a set of classes of the same version and ID.
    For example returns all the CSE 20 classes given that ID.
    :param class_id: The id we want, for example CSE 20
    :return: returns all the classes with the same ID in a list
    """
    cursor.execute("SELECT ROWID FROM DATA WHERE COURSE_NUM = ?", (class_id,))
    # The different sections of the given class
    class_versions = []

    for id_tuple in cursor.fetchall():
        id_tuple = dict(id_tuple)
        ID = id_tuple['rowid']
        # Create a class object and add it to the sections
        class_version = Class(cursor, ID)
        class_versions.append(class_version)
    return class_versions


def generate_class_set(class_ids):
    """
    Accesses the database and returns the list of classes with the corresponding course num.
    :param class_ids the list of classes we are trying to select
    :return The corresponding class set
    """

    # Where the classes will be stored
    class_set = []
    # Access each preferred class in given list and store it inside class_set
    for pref_class in class_ids:
        class_set.append(generate_class_versions(pref_class))
    return class_set