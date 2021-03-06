import os
import sqlite3

from selenium import webdriver
from selenium.webdriver.common.desired_capabilities import DesiredCapabilities

from settings import DATABASE_PATH, DATABASE_FOLDER_PATH
from settings import DEPARTMENT_URL
from settings import HOME_DIR
from settings import DRIVER_PATH

class DepartmentScraper:
    INFO_MAX_INDEX = 4

    def __init__(self):
        options = webdriver.ChromeOptions()
        options.add_argument('--headless')
        options.add_argument('--no-sandbox')
        options.add_argument('--disable-dev-shm-usage')

        # Start up the browser
        self.browser = webdriver.Chrome(chrome_options=options, executable_path=DRIVER_PATH)

        # Add an implicit wait so that the department options load
        self.browser.implicitly_wait(15)

        # Establish database connection
        os.makedirs(DATABASE_FOLDER_PATH, exist_ok=True)
        self.database = sqlite3.connect(DATABASE_PATH)
        self.database.row_factory = sqlite3.Row
        self.cursor = self.database.cursor()

    def create_table(self):
        self.cursor.execute('DROP TABLE IF EXISTS DEPARTMENT')
        self.cursor.execute('CREATE TABLE IF NOT EXISTS DEPARTMENT (DEPT_CODE TEXT)')

    def scrape(self):
        print("Beginning department scraping.")
        self.create_table()
        self.search()
        self.get_departments()
        self.close()
        print("Finished department scraping.")

    def search(self):
        self.browser.get(DEPARTMENT_URL)

    def get_departments(self):
        departments = self.browser.find_element_by_id('selectedSubjects') \
            .find_elements_by_tag_name('option')
        for department in departments:
            department = department.text
            # Get first four elements
            department = department[:DepartmentScraper.INFO_MAX_INDEX]
            # Making sure department is in the correct format
            department = self.normalize_department(department)
            self.cursor.execute('INSERT INTO DEPARTMENT VALUES(?)', (department,))

    def normalize_department(self, department):
        return department.strip()

    def close(self):
        self.database.commit()
        self.database.close()
        self.browser.close()
