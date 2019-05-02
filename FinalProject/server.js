/***************************************************************************************************** 
 * 
 * Online (Heroku) Link:      https://protected-dusk-37637.herokuapp.com/
 *
 * **************************************************************************************************/

// require data-service.js and data-service-auth.js as a modules
const ownModule = require("./data-service.js");
const dataServiceAuth = require("./data-service-auth.js");

// server takes use of the express module
const express = require ("express");
const app = express();

// enables working with file and directory paths
const path = require("path");

// enables name, save files to the file system once they are uploaded
const multer = require("multer");

// enables to pass path or filename arguments
const fs = require("fs");

// enables handle regular text submissions and access data on req.body
const bodyParser = require("body-parser");

// server on PORT || 8080 
const HTTP_PORT = process.env.PORT || 8080;

// server outputs info about the currently listening port
function onHttpStart() {
    console.log ("Express http server listening on:" + HTTP_PORT);
}

// define a helper middleware function to check is user is loged in
function ensureLogin(req, res, next){
    if(!req.session.user){                              
        res.redirect("/login");
    }
    else{
        next();
    }
}

// ensures that files are stored with file extensions
const storage = multer.diskStorage({
    destination: "./public/images/uploaded",
    filename: function(req, file, cb){
        cb(null, Date.now() + path.extname(file.originalname));
    }
});

// uses diskStorage for naming files instead of default
const upload = multer({storage: storage});

// enables adding client sessions
const clientSessions = require("client-sessions");

// require handlebars
const exphbs = require("express-handlebars");

// register handlebars as the rendering engine for views
app.engine(".hbs", exphbs ({
    extname: ".hbs",
    defaultLayout: "main",
    helpers: {
        // helper #1: if provided url matches it adds class active to the appropriate element  
        navLink: function(url, options) {
            return '<li' +
            ((url == app.locals.activeRoute) ? ' class="active" ' : '') +
            '><a href="' + url + '">' + options.fn(this) + '</a></li>';
        },
        // helper #2: it evaluates conditions for equality
        equal: function(lvalue, rvalue, options) {
            if(arguments.length < 3)
                throw new Error("Handlebars Helper equal needs 2 paramenets");
            if(lvalue != rvalue) {
                return options.inverse(this);
            }
            else {
                return options.fn(this);
            }
        }
    }
}));
app.set("view engine", ".hbs");

// setup client-sessions, register client-sessions as a middleware and configure it
app.use(clientSessions ({
    cookieName:     "session",
    secret:         "web322Assignment_6_semester3_2018_hardToGuess",
    duration:       3*60*1000,
    activeDuration: 2*60*1000
}));

// ensures that all of templates have access to a "session" object
app.use(function(req, res, next){
    res.locals.session = req.session;
    next();
});

// sets middleware for "urlencoded" form data
app.use(bodyParser.urlencoded({extended: true}));

// server correctly returns static files like css or img
app.use(express.static("public"));

// middleware, to add activeRoute to app.locals when route is changed
app.use(function(req,res,next){
    let route = req.baseUrl + req.path;     
    app.locals.activeRoute = (route == "/") ? "/" : route.replace(/\/$/, "");     
    next();     
});

// ******************************************************************************************
// defining routes /home, /about, etc.
// ******************************************************************************************
app.get("/", function(req,res){ 
    res.render("home");
});

app.get("/about", function (req,res){
    res.render("about");
});

// ******************************************************************************************
// IMAGES
// ******************************************************************************************
app.get("/images/add", ensureLogin, function (req,res){
    res.render("addImage");
});

// sends the object of the array of images
app.get("/images", ensureLogin, function(req,res){
    fs.readdir("./public/images/uploaded", function(err, imagesData){
        res.render("images", {imgArray: imagesData});
    });
});

// redirects to the /images route   // ensureLogin, ?????????????
app.post("/images/add", upload.single("imageFile"), (req, res) => {
    res.redirect("/images");    
});

// ******************************************************************************************
// EMPLOYEES
// ******************************************************************************************

// define employees route
app.get("/employees", ensureLogin, function (req,res){
    
    if (req.query.status){
        ownModule.getEmployeesByStatus(req.query.status)   
        .then((data)=>{
            res.render("employees", {employees: data});
        })
        .catch((err)=>{
            res.render("employees", {message: err});
        });
    }
    else if (req.query.department) {
        ownModule.getEmployeesByDepartment(req.query.department)
        .then((data)=>{
            res.render("employees", {employees: data});
        })
        .catch((err)=>{
            res.render("employees", {message: err});
        });
    }
    else if(req.query.manager) {
        ownModule.getEmployeesByManager(req.query.manager)
        .then((data)=>{
            res.render("employees", {employees: data});
        })
        .catch((err)=>{
            res.render("employees", {message: err});
        });
    }
    else {
        ownModule.getAllEmployees()
        .then((data)=>{
            if (data.length > 0) {
                res.render("employees", {employees: data});
            }
            else {
                res.render("employees", {message: "No results for employees!"});
            }
        })
        .catch((err)=>{
            res.render("employees", {message: err});
        });
    }        
});

// add new employee
app.get("/employees/add", ensureLogin, function (req,res){
    ownModule.getDepartments()
    .then( (data) =>{
        res.render("addEmployee", {departments: data});
    })
    .catch(()=>{
        res.render("addEmployee", {departments: []});
    })
});

// call addEmployee(), if succeess then redirects to "/employees" route
app.post("/employees/add", ensureLogin, function(req,res){
    ownModule.addEmployee(req.body)
    .then(
        res.redirect("/employees")
    )
    .catch((err)=>{
        res.status(500).send("Unable to add an employee!");
    });
});

// calls updateEmployee(), and after update redirects to "/employees" route
app.post("/employee/update", ensureLogin, (req,res)=>{
    console.log(req.body);
    ownModule.updateEmployee(req.body)
    .then(
        res.redirect("/employees")
    )
    .catch((err)=>{
        res.status(500).send("Unable to update an employee!");
    });
});

// returns matching employeeNum employee  // code has been provided
app.get("/employee/:empNum", ensureLogin, (req, res) => {
    // initialize an empty object to store the values
    let viewData = {};

    ownModule.getEmployeeByNum(req.params.empNum).then((data) => {
        if (data) {
            viewData.employee = data; //store employee data in the "viewData" object as "employee"
        } else {
            viewData.employee = null; // set employee to null if none were returned
        }
    }).catch(() => {
        viewData.employee = null; // set employee to null if there was an error
    }).then(ownModule.getDepartments)
    .then((data) => {
        viewData.departments = data; // store department data in the "viewData" object as "departments"
        // loop through viewData.departments and once we have found the departmentId that matches
        // the employee's "department" value, add a "selected" property to the matching
        // viewData.departments object
        for (let i = 0; i < viewData.departments.length; i++) {
            if (viewData.departments[i].departmentId == viewData.employee.department) {
                viewData.departments[i].selected = true;
            }
        }
    }).catch(() => {
        viewData.departments = []; // set departments to empty if there was an error
    }).then(() => {
        if (viewData.employee == null) { // if no employee - return an error
            res.status(404).send("Employee Not Found");
        } else {
            res.render("employee", { viewData: viewData }); // render the "employee" view
        }
    });   
});

// delete matching employeeNum employee
app.get("/employees/delete/:empNum", ensureLogin, function(req, res){
    ownModule.deleteEmployeeByNum(req.params.empNum)
    .then(
        res.redirect("/employees")
    )
    .catch(
        res.status(500).send("Unable to Remove Employee/Employee not found!")
    )
});

// ******************************************************************************************
// DEPARTMENTS
// ******************************************************************************************

// define route departments
app.get("/departments", ensureLogin, function(req,res){
    ownModule.getDepartments()
    .then((data)=>{
        if (data.length > 0) {
            res.render("departments", {departments: data});
        }
        else {
            res.render("departments", {message: "No result for departments!"});
        }
    })
    .catch((err)=>{
        res.render("departments", {message: err});
    });
});

// add departments
app.get("/departments/add", ensureLogin, function(req, res){
    res.render("addDepartment");
});

// call addDepartment(), if success then redirect "/departments" route
app.post("/departments/add", ensureLogin, function(req, res){
    ownModule.addDepartment(req.body)
    .then(
        res.redirect("/departments")
    )
    .catch((err)=>{
        res.status(500).send("Unable to add a department!");
    });
});

// calls updateDepartment() function
app.post("/department/update", ensureLogin, function(req, res){
    ownModule.updateDepartment(req.body)
    .then(
        res.redirect("/departments")
    )
    .catch((err)=>{
        res.status(500).send("Unable to update a department!");
    });
});

// returns matching departmentId department
app.get("/department/:departmentId", ensureLogin, function(req, res){
    ownModule.getDepartmentById(req.params.departmentId)
    .then((data)=>{
        if (data) {
            res.render("department", {department: data});
        }
        else{
            res.status(404).send("Department not Found!");
        }
    })
    .catch(()=>{
        res.status(404).render("error404");                     
    })
});

// deletes matching departmentId department
app.get("/departments/delete/:departmentId", ensureLogin, function(req, res){
    ownModule.deleteDepartmentById(req.params.departmentId)
    .then(
        res.redirect("/departments")
    )
    .catch(
        res.status(500).send("Unable to Remove Department/Department not found!")
    )
});

// ******************************************************************************************
// client sessions routes _ REGISTER / LOGIN / LOGOUT / userHISTORY
// ******************************************************************************************

app.get("/login", (req,res)=>{
    res.render("login");
});

app.get("/register", (req, res)=>{
    res.render("register");
});

// register user if data doesn't match with already registered ones
app.post("/register", (req, res)=>{
    dataServiceAuth.registerUser(req.body)
    .then(()=>{
        res.render("register", {successMessage: "User created"});
    })
    .catch((err)=>{
        res.render("register", {errorMessage: err, userName: req.body.userName});
    })
});

// identify a user, otherwise give an error message
app.post("/login", (req, res)=>{
    // set the value of the client's "User-Agent"
    req.body.userAgent = req.get('User-Agent');

    // add the user on the session and redirec to the employees page
    dataServiceAuth.checkUser(req.body)
    .then((user)=>{
        req.session.user = {
            userName:       user.userName,
            email:          user.email,
            loginHistory:   user.loginHistory
        }

        res.redirect("/employees");
    })
    .catch((err)=>{
        res.render("login", {errorMessage: err, userName: req.body.userName})
    });
});

// logout a user by destroying their session
app.get("/logout", (req, res)=>{
    req.session.reset();
    res.redirect("/");
});

// renders userHistory view 
app.get("/userHistory", ensureLogin, (req, res)=>{
    res.render("userHistory");
})


// ******************************************************************************************
// ******************************************************************************************

// in case, if user enters not matching route
app.use((req, res) => {
    res.status(404).render("error404");
});

// if initialize() method is successful, only after that we can call app.listern()
ownModule.initialize()
.then(dataServiceAuth.initialize)
.then(()=>{
    app.listen(HTTP_PORT, onHttpStart);
})
.catch(()=>{
    console.log("ErrorMssg: Server can't listen, as initialize() method is rejected!");
});
