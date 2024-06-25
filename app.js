const express = require('express')
const app = express()
const port = 3001
var mysql = require('mysql2');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');
require('dotenv').config();


app.use(bodyParser.json());
app.use(cors());

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


// var con = mysql.createConnection({
//   host     : 'localhost',
//   user     : 'root',
//   password : 'root',
//   database : 'employee'
// });

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    ssl: {
      rejectUnauthorized: false // Adjust based on your SSL setup
    }
  });

con.connect(function(err) {
 if (err){
    console.log(err);
 }else {
    console.log("Connected!");
    con.query('CREATE TABLE IF NOT EXISTS USER (id INT AUTO_INCREMENT PRIMARY KEY, email VARCHAR(255), password VARCHAR(255), name VARCHAR(255))', (err, result) => {
        if (err) {
          console.error('Error creating table:', err);
        } else {
          console.log('Table created successfully');
        }
      });
    con.query('CREATE TABLE IF NOT EXISTS EMPLOYEE (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255), email VARCHAR(255), phone VARCHAR(255), address VARCHAR(255), salary INT, age INT)', (err, result) => {
        if (err) {
          console.error('Error creating table:', err);
        } else {
          console.log('Table created successfully');
        }
      }
    );
 }
});

app.get('/getemployee',(req,res)=>{
    con.query('SELECT * FROM EMPLOYEE',(err,result)=>{
        if(result){
            res.send(result);
        } else {
            console.log(err);
        } 

    })
})

app.get('/getemployee/:id',(req,res)=>{
    const id = req.params.id;
    con.query('SELECT * FROM EMPLOYEE WHERE id = ?',[id],(err,result)=>{
        if(result){
            res.send(result);
        } else {
            console.log(err);
        } 
    })
})

app.put('/update/:id',(req,res)=>{
    const id = req.params.id;

    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;
    const salary = req.body.salary;
    const age = req.body.age;

    con.query('UPDATE EMPLOYEE SET name = ?, email = ?, phone = ?, address = ?, salary = ?, age = ? WHERE id = ?',[name,email,phone,address,salary,age,id],(err,result)=>{
        if(result){
            res.send(result);
        } else {
            console.log(err);
        } 
    })
})
app.post('/create',(req,res)=>{
    ///const id = req.body.id;
    const name = req.body.name;
    const email = req.body.email;
    const phone = req.body.phone;
    const address = req.body.address;
    const salary = req.body.salary;
    const age = req.body.age;

    console.log(name,email,phone,address,salary,age);

    con.query('INSERT INTO EMPLOYEE (name,email,phone,address,salary,age) VALUES (?,?,?,?,?,?)',[name,email,phone,address,salary,age],(err,result)=>{
        if(result){
            console.log(result);
        }
        if(err){
            console.log(err);
        }else{
            res.send('Values Inserted');
        }
    })
})

app.delete('/delete/:id',(req,res)=>{
    const id = req.params.id;
    con.query('DELETE FROM EMPLOYEE WHERE id = ?',[id],(err,result)=>{
        if(result){
            res.send(result);
        } else {
            console.log(err);
        }
    })
})

app.get('/count',(req,res)=>{
    con.query('SELECT COUNT(*)  FROM EMPLOYEE',(err,result)=>{
        if(result){
            res.send(result);
        } else {
            console.log(err);
        }
    })
})

app.get('/admincount',(req,res)=>{
    con.query('SELECT COUNT(*)  FROM USER',(err,result)=>{
        if(result){
            res.send(result);
        } else {
            console.log(err);
        }
    })
})


app.get('/sum',(req,res)=>{
    con.query('SELECT SUM(salary) FROM EMPLOYEE',(err,result)=>{
        if(result){
            res.send(result);
        } else {
            console.log(err);
        }
    })
})

app.post('/register', (req, res) => {
    const { email, password, name } = req.body;
  
    // Hash password using bcrypt
    const salt = bcrypt.genSaltSync(10);
    const hash = bcrypt.hashSync(password,salt);
    
    // Insert user into database
    con.query('INSERT INTO USER (email, password, name) VALUES (?, ?, ?)', [email, hash, name], (err, result) => {
      if (err) {
        console.error("Error registering user:", err);
        return res.status(500).send('Error registering user');
      } else {
        console.log('User registered successfully');
        return res.status(200).send('User registered successfully');
      }
    });
});


// app.post('/login',(req,res)=>{
//     const email = req.body.email;
//     const password = req.body.password;

//     con.query('SELECT * FROM USER WHERE EMAIL = ?', [email], (err, results) => {
//         if (err) {
//           console.error('Error querying database:', err);
//           return;
//         }
     
//         const user = results[0];
        
//         // Compare hashed password with input password
//         const isPasswordCorrect = bcrypt.compareSync(password, user.PASSWORD);
      
//         if (isPasswordCorrect) {
//           console.log('Login successful');
//           const token = jwt.sign({role:"admin"},'jwtsecretkey',{expiresIn: '1h'});
//             res.json({status:"Success" ,token:token});
//           // Proceed with authenticated actions
//         } else {
//           console.log('Login failed');
//         }
//       });
// })



app.post('/login', (req, res) => {
    const sql = "SELECT * FROM USER WHERE EMAIL = ?";
    con.query(sql, [req.body.email], (err, result) => {
        if (err) {
            console.error("Error in running query:", err);
            return res.json({ Status: "Error", Error: "Error in running query" });
        }
        
        if (result.length > 0) {
            
            const hashedPassword = result[0].password;
            
            
            bcrypt.compare(req.body.password, hashedPassword, (err, response) => {
                if (err) {
                    console.error("Password comparison error:", err);
                    return res.json({ Status: "Error", Error: "Password comparison error" });
                }
                
                if (response) {
                    // Passwords match, generate JWT token
                    const token = jwt.sign({ email: req.body.email }, "jwt-secret-key", { expiresIn: '1d' });
                    return res.json({ Status: "Success", Token: token });
                } else {
                    // Passwords do not match
                    return res.json({ Status: "Error", Error: "Wrong Email or Password" });
                }
            });
        } else {
            // User not found
            return res.json({ Status: "Error", Error: "User not found" });
        }
    });
});
