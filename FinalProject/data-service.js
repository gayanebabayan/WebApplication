// request sequelize
//*********************************************************************
const Sequelize = require('sequelize');


// so we can test our connection to the database
//*********************************************************************
var sequelize = new Sequelize('dcdu9tenucl7ea', 'zvmirkotavhnqe', '2ed018087e76a296de1076e02eb38b66603146faeb85a34420124c550d431dff', {
    host: 'ec2-50-19-127-158.compute-1.amazonaws.com',
    dialect: 'postgres',
    port: '5432',
    dialectOptions: {
        ssl: true
    }
});

// define Employee data model
//*********************************************************************
var Employee = sequelize.define('Employee', {
    employeeNum: {
            type:       Sequelize.INTEGER,
            primaryKey:     true,
            autoIncrement:  true
    },
    firstName:          Sequelize.STRING,
    lastName:           Sequelize.STRING,
    email:              Sequelize.STRING,
    SSN:                Sequelize.STRING,
    addressStreet:      Sequelize.STRING,
    addressCity:        Sequelize.STRING,
    addressState:       Sequelize.STRING,
    addressPostal:      Sequelize.STRING,
    maritalStatus:      Sequelize.STRING,
    isManager:          Sequelize.BOOLEAN,
    employeeManagerNum: Sequelize.INTEGER,
    status:             Sequelize.STRING,
    hireDate:           Sequelize.STRING
});

// define Department data model
//*********************************************************************
var Department = sequelize.define('Department', {
    departmentId: {
        type:       Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    departmentName: Sequelize.STRING
});

// Department and Employee models hasMany relationship 
//*********************************************************************
Department.hasMany(Employee, {foreignKey: 'department'});

// check if we can connect to the DB and models
//*********************************************************************
module.exports.initialize = function(){
    return new Promise(function(resolve, reject) {  
        sequelize.sync().then(()=>{
            resolve();
        })
        .catch((err)=>{
            reject("Unable to sync the database!" + err);
        });
    });
}

// invokes Employee.findAll(), which either retuns data or errMsg
//*********************************************************************
module.exports.getAllEmployees = function() {
    return new Promise (function(resolve, reject){
        Employee.findAll()
        .then((data)=>{
            resolve(data);
        })
        .catch(()=>{
            reject("No Employee Data is returned back!");
        })
    });
}

// get employees where isManager==true
//*********************************************************************
module.exports.getManagers = function() {
    return new Promise((resolve, reject) => {
        reject();
    });
}

// provides full array of departments on the returned promise
//*********************************************************************
module.exports.getDepartments = function(){
    return new Promise(function(resolve, reject){
        Department.findAll()
        .then((data)=>{
            resolve(data);
        })
        .catch(()=>{
            reject("No Department Data is returned back!");
        })
    });
}

// add new department into the department list
//*********************************************************************
module.exports.addDepartment = function(departmentData){
    return new Promise((resolve, reject)=>{
        // loop through all properties
        for (const prop in departmentData){
            // check for the blank values
            if(departmentData[prop] == ""){
                departmentData[prop] = null;
            }
        }
        Department.create(departmentData)
        .then(()=>{
            resolve();
        })
        .catch(()=>{
            reject("Unable to creat a department!");
        })
    });
}

// adds new employee into the employees array
//*********************************************************************
module.exports.addEmployee = function(employeeData){
    return new Promise(function(resolve, reject){
        
        // set isManager either true or false 
        employeeData.isManager = (employeeData.isManager) ? true : false;

        // loop through the all properties
        for (const prop in employeeData) {
            // check for the blank values
            if(employeeData[prop] == "") {
                    employeeData[prop] = null;
            }
        }
        // create an employee and communicate back to the server
        Employee.create(employeeData)
        .then(()=>{
            resolve();
        })
        .catch((err)=>{
            reject("Unable to create an employee!" + err);
        })
    });    
}

// findAll employees by status (Full Time / Part Time)
//*********************************************************************
module.exports.getEmployeesByStatus = function(status) {
    return new Promise ((resolve, reject) =>{
        Employee.findAll({
            where: {status: status}
        })
        .then((data)=>{
            resolve(data);
        })
        .catch(()=>{
            reject("No employees with the required status!");
        })
    });
}

// findAll employee by department
//*********************************************************************
module.exports.getEmployeesByDepartment = function(department) {
    return new Promise ((resolve, reject) =>{
        Employee.findAll({
            where: {department: department}
        })
        .then((data)=>{
            resolve(data);
        })
        .catch(()=>{
            reject("No employees at the required department!");
        })
    });
}

// findAll employees by Manager
//*********************************************************************
module.exports.getEmployeesByManager = function(manager) {
    return new Promise ((resolve, reject) =>{
        Employee.findAll({
            where: {employeeManagerNum: manager}
        })
        .then((data)=>{
            resolve(data);
        })
        .catch(()=>{
            reject("No employees exist with the required managerID!");
        })
    });
}

// findAll employee by number
//*********************************************************************
module.exports.getEmployeeByNum = function(num){
    return new Promise ((resolve, reject) =>{
        Employee.findAll({
            where: {employeeNum: num}
        })
        .then((data)=>{
            resolve(data[0]);
        })
        .catch(()=>{
            reject("No employee exists with required employeeNumber!");
        })
    });
}

// updates employee data in the main employees array
//*********************************************************************
module.exports.updateEmployee = function(employeeData){
    return new Promise((resolve, reject) =>{
        // set isManager either true or false         
        employeeData.isManager = (employeeData.isManager) ? true : false;
                    
        // loop through the all properties        
        for (const prop in employeeData) {                    
            // check for the blank value
            if (employeeData[prop] == ""){
                employeeData[prop] = null;
            }    
        }
        // update the info of the Employee
        Employee.update(employeeData,{
            where: {employeeNum: employeeData.employeeNum}
        })
        .then(()=>{
            resolve();
        })
        .catch(()=>{
            reject("Unable to update employee!");
        })
    });
}

// update department data in the department list
//*********************************************************************
module.exports.updateDepartment = function(departmentData){
    return new Promise((resolve, reject) =>{
        // loop through the all the properties
        for (const prop in departmentData){
            // check for the blank values
            if(departmentData[prop] == "") {
                departmentData[prop] = null;
            }
        }
        // update the department
        Department.update(departmentData,{
            where: {departmentId: departmentData.departmentId}
        })
        .then(()=>{
            resolve();
        })
        .catch(()=>{
            reject("Unable to update department!");
        })
    });
}

// findAll department list
//*********************************************************************
module.exports.getDepartmentById = function(id){
    return new Promise((resolve, reject)=>{
        Department.findAll({
            where: {departmentId: id}
        })
        .then((data)=>{
            resolve(data[0]);
        })
        .catch(()=>{
            reject("No department returned!");
        })
    });
}

// delete department from the department list
//*********************************************************************
module.exports.deleteDepartmentById = function(id){
    return new Promise((resolve, reject)=>{
        Department.destroy({
            where: {departmentId: id}
        })
        .then(()=>{
            resolve();
        })
        .catch(()=>{
            reject("Unable to delete the department!");
        })
    });
}

// delete employee from the employee list
//*********************************************************************
module.exports.deleteEmployeeByNum = function(empNum){
    return new Promise((resolve, reject)=>{
        Employee.destroy({
            where: {employeeNum: empNum}
        })
        .then(()=>{
            resolve();
        })
        .catch((err)=>{
            reject("Unable to delete the employee" + err);
        })
    });
}







