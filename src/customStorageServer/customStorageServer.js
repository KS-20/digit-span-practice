import http from "http";
const port = 6001;
import bcrypt from "bcrypt";
import mysql from "mysql2";

import 'dotenv/config';
import jwt from "jsonwebtoken";
import { serverMsgs,dbColumnNames } from '../repeatedStrings.js'

const DB_HOST = process.env.DB_HOST
const DB_USER = process.env.DB_USER
const DB_PASSWORD = process.env.DB_PASSWORD
const DB_DATABASE = process.env.DB_DATABASE
const DB_PORT = process.env.DB_PORT

const db = mysql.createPool({
  connectionLimit: 100,
  host: DB_HOST,
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_DATABASE,
  port: DB_PORT,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
})

let databaseSizeLimits = new Map();

async function readDataSizeLimits() {
  console.log("Reading database constraints for checking input size limits")
  const promisePool = db.promise();
  const sqlSearch = `select COLUMN_NAME, CHARACTER_MAXIMUM_LENGTH 
    from information_schema.columns
    where table_schema = DATABASE() AND
          table_name = 'users' AND 
          COLUMN_NAME = ? 
    `
  for (const columnName in dbColumnNames) {
    const [rows,fields] = await promisePool.query(sqlSearch,[dbColumnNames[columnName]]);
    databaseSizeLimits.set(rows[0].COLUMN_NAME,rows[0].CHARACTER_MAXIMUM_LENGTH);
  }
}

await readDataSizeLimits();

http.createServer(async (req, res) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'OPTIONS, POST, GET',
    'Access-Control-Max-Age': 2592000, // 30 days
    'Access-Control-Allow-Headers': 'requestType , accessToken'
  };

  if (req.method === 'OPTIONS') {
    res.writeHead(204, headers);
    res.end();
    return;
  }

  if (['GET', 'POST'].indexOf(req.method) > -1) {

    const buffers = [];

    for await (const chunk of req) {
      buffers.push(chunk);
    }

    const data = Buffer.concat(buffers).toString();

    //todo: validate input on the server side
    var requestObject;
    if (data != "") {
      requestObject = JSON.parse(data)
    }

    var accessToken;
    if (requestObject != undefined) {
      accessToken = requestObject.accessToken
    } else if (req.headers.requesttype !== undefined) {
      accessToken = req.headers.accesstoken;
    }
    var decodedToken;
    if (accessToken !== undefined) {
      try {
        decodedToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
      } catch (e) {
        if (e.message === "jwt expired") {
          const answerObj = { resultStr: serverMsgs.accessTokenExpired };
          res.writeHead(200, headers);
          res.end(JSON.stringify(answerObj));
          return
        } else {
          const answerObj = { resultStr: "Error verifying jwt, error message: " + e.message };
          res.writeHead(400, headers);
          res.end(JSON.stringify(answerObj));
          return
        }
      }
    }

    var requestType;
    if (requestObject != undefined) {
      requestType = requestObject.requestType;
    } else if (req.headers.requesttype !== undefined) {
      requestType = req.headers.requesttype;
    }
    if (requestObject != undefined) {
      if (requestType == "signup") {
        await signUpUser(requestObject, headers, res);
      } else if (requestType == "login") {
        await logInUser(requestObject, headers, res);
      } else if (requestType == "setPerformanceRecord") {
        savePerfRecord(decodedToken, requestObject, headers, res);
      } else if (requestType == "saveCurrentCategory") {
        saveCurrentCategory(decodedToken, requestObject, headers, res);
      } else if (requestType == "saveTrailCategories") {
        saveTrailCategories(decodedToken, requestObject, headers, res);
      }
    } else if (req.headers.requesttype !== undefined) {
      if (requestType === "getPerformanceRecord") {
        sendPerfRecord(decodedToken, headers, res);
      } else if (requestType === "getCurrentCategory") {
        sendCurrentCategory(decodedToken, headers, res);
      } else if (requestType === "getTrailCategories") {
        sendTrailCategories(decodedToken, headers, res);
      } else if (requestType === "getDataSizeLimits") {
        sendDataSizeLimits(headers, res);
      }
    }

    return;
  }

  res.writeHead(405, headers);
  res.end(`${req.method} is not allowed for the request.`);
}).listen(port);

function saveTrailCategories(decodedToken, requestObject, headers, res) {
  const categoriesSizeLimit = databaseSizeLimits.get(dbColumnNames.trailCategories);

  const categoriesArray = requestObject.categoriesArray;
  if( categoriesArray.length > categoriesSizeLimit ) {
    const answerObj = { resultStr: "Categories data exceeds the maximum size of "+categoriesSizeLimit+" characters" };
    res.writeHead(409, headers);
    res.end(JSON.stringify(answerObj));
    return;
  }


  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "UPDATE users SET TrailCategories = ? WHERE UserName = ?"
    const search_query = mysql.format(sqlSearch, [categoriesArray, decodedToken.userName])
    connection.query(search_query, async (err, result) => {
      if (err) throw (err)
      const answerObj = { resultStr: "saved trail categories" };
      res.writeHead(200, headers);
      res.end(JSON.stringify(answerObj));

      connection.release()
    })
  })
}


function saveCurrentCategory(decodedToken, requestObject, headers, res) {
  const categorySizeLimit = databaseSizeLimits.get(dbColumnNames.currentCategory);
  const currentCategory = requestObject.currentCategory;
  if( currentCategory.length > categorySizeLimit ) {
    const answerObj = { resultStr: "Current category exceeds the maximum size of "+categorySizeLimit+" characters" };
    res.writeHead(409, headers);
    res.end(JSON.stringify(answerObj));
    return;
  }

  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "UPDATE users SET CurrentCategory = ? WHERE UserName = ?"
    const search_query = mysql.format(sqlSearch, [currentCategory, decodedToken.userName])
    connection.query(search_query, async (err, result) => {
      if (err) throw (err)
      const answerObj = { resultStr: "saved current category" };
      res.writeHead(200, headers);
      res.end(JSON.stringify(answerObj));

      connection.release()

    })
  })
}

function sendCurrentCategory(decodedToken, headers, res) {

  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "SELECT CurrentCategory FROM users WHERE UserName = ?"
    const search_query = mysql.format(sqlSearch, [decodedToken.userName])
    connection.query(search_query, async (err, result) => {
      if (err) throw (err)
      const answerObj = { resultStr: "sent current category", currentCategory: result[0].CurrentCategory };
      res.writeHead(200, headers);
      res.end(JSON.stringify(answerObj));

      connection.release()

    })
  })
}

function sendTrailCategories(decodedToken, headers, res) {

  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "SELECT TrailCategories FROM users WHERE UserName = ?"
    const search_query = mysql.format(sqlSearch, [decodedToken.userName])
    connection.query(search_query, async (err, result) => {
      if (err) throw (err)
      const answerObj = { resultStr: "sent trail categories", categoriesArray: result[0].TrailCategories };
      res.writeHead(200, headers);
      res.end(JSON.stringify(answerObj));

      connection.release()

    })
  })
}


function sendPerfRecord(decodedToken, headers, res) {

  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "SELECT PerformanceData FROM users WHERE UserName = ?"
    const search_query = mysql.format(sqlSearch, [decodedToken.userName])
    connection.query(search_query, async (err, result) => {
      if (err) throw (err)
      const answerObj = { resultStr: "sent performancce record", performanceRecord: result[0].PerformanceData };
      res.writeHead(200, headers);
      res.end(JSON.stringify(answerObj));

      connection.release()

    })
  })
}

function sendDataSizeLimits(headers, res) {
  const answerObj = { resultStr: "sent data size limits", dataSizeLimits: Object.fromEntries(databaseSizeLimits) };
  res.writeHead(200, headers);
  res.end(JSON.stringify(answerObj));
}


function savePerfRecord(decodedToken, requestObject, headers, res) {

  const PerfRecordSizeLimit = databaseSizeLimits.get(dbColumnNames.performanceData);
  const performanceRecord = requestObject.performanceRecord;
  const jsonPerfRecord = JSON.stringify(performanceRecord);
  if( jsonPerfRecord.length > PerfRecordSizeLimit ) {
    const answerObj = { resultStr: "Performance data exceeds the maximum size of "+PerfRecordSizeLimit+" characters" };
    res.writeHead(409, headers);
    res.end(JSON.stringify(answerObj));
    return;
  }


  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "UPDATE users SET  PerformanceData = ? WHERE UserName = ?"
    const search_query = mysql.format(sqlSearch, [jsonPerfRecord, decodedToken.userName])
    connection.query(search_query, async (err, result) => {
      if (err) throw (err)
      const answerObj = { resultStr: "saved performancce record" };
      res.writeHead(200, headers);
      res.end(JSON.stringify(answerObj));
      connection.release()
    })
  })
}

function generateAccessToken(user) {
  return jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: "31d" });
}

async function logInUser(requestObject, headers, res) {
  var userName = requestObject.userName;
  var password = requestObject.password;
  db.getConnection(async (err, connection) => {
    if (err) throw (err);
    const sqlSearch = "SELECT * FROM users WHERE UserName = ?";
    const search_query = mysql.format(sqlSearch, [userName]);

    connection.query(search_query, async (err, result) => {
      connection.release()

      if (err) throw (err)
      if (result.length == 0) {
        const answerObj = { resultStr: "Cant log in: user does not exist" }
        res.writeHead(404, headers);
        res.end(JSON.stringify(answerObj));
      }
      else {
        const hashedPassword = result[0].HashedPassword;
        if (await bcrypt.compare(password, hashedPassword)) {
          const token = generateAccessToken({ userName: userName });
          //maybe use specially configured cookies for better security, see: https://www.rdegges.com/2018/please-stop-using-local-storage/
          const answerObj = { resultStr: "Login Successful", accessToken: token };
          res.writeHead(200, headers);
          res.end(JSON.stringify(answerObj));
        } else {
          const answerObj = { resultStr: "Cant log in: Password incorrect" }
          res.writeHead(200, headers);
          res.end(JSON.stringify(answerObj));
        }
      }
    })
  })
}

async function signUpUser(requestObject, headers, res) {
  var userName = requestObject.userName;
  const userNameSizeLimit = databaseSizeLimits.get(dbColumnNames.userName);
  if( userName.length > userNameSizeLimit ) {
    const answerObj = { resultStr: "User name exceeds the maximum size of "+userNameSizeLimit+" characters" };
    res.writeHead(409, headers);
    res.end(JSON.stringify(answerObj));
    return;
  }
  var password = requestObject.password;
  //10 is the default for bcrypt.genSalt , so we will use it here
  const hashedPassword = await bcrypt.hash(password, 10); //using bcrypt with async await does not block node event loop thread.

  db.getConnection(async (err, connection) => {
    if (err) throw (err)
    const sqlSearch = "SELECT * FROM users WHERE UserName = ?"
    const search_query = mysql.format(sqlSearch, [userName])
    const sqlInsert = "INSERT INTO users (UserName,HashedPassword) VALUES (?,?)";
    const insert_query = mysql.format(sqlInsert, [userName, hashedPassword])
    connection.query(search_query, async (err, result) => {
      if (err) throw (err)
      if (result.length != 0) {
        connection.release()
        const answerObj = { resultStr: "User already exists" }
        res.writeHead(409, headers);
        res.end(JSON.stringify(answerObj));
      }
      else {
        connection.query(insert_query, (err, result) => {
          connection.release()
          if (err) throw (err)
          const answerObj = { resultStr: "Created new User" }
          res.writeHead(201, headers);
          res.end(JSON.stringify(answerObj));
        })
      }
    })
  })
}
