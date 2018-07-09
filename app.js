
var express = require('express');
var app = express();
var mysql   = require('mysql');


var connection = mysql.createConnection({
  host     : '192.168.0.10',
  user     : 'root',
  password : 'dB0ss99...',
  database : 'asterisk'
});



//PAra recibir json
app.use(express.json());

app.use(function(req, res,next) {  
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header('Content-Type', 'text/plain');
  next();
});



 
let query="select state,count(*) as count from vicidial_list where list_id in (69262,69276,69270) group by 1" ;

connection.query(query, function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0]);
    if(results.length==0){
      results=['tx']; //corregir
    }
    app.get('/', function (req, res) {
    res.send(results.map( x=> x));
    });
});

app.post('/submit', function (req, res) {
    updateFilter(req.body);
    console.log("/submit",req.body)
    Promise.all([getStatus(req.body)]).then(results=>res.send(results[0])
    )    
}) 

app.post('/initialState', function (req, res) {
  res.header('Content-Type', 'application/json');

  query="select campaign_cid from vicidial_campaigns  where campaign_id='pft'";
  query2="select lead_filter_sql from vicidial_lead_filters where lead_filter_id ='PFT_states'";
  var cal='';
  results=(r)=>{

    cal=r;
  }
  // const Promise1=Promise.resolve(getInitialState(query));

  Promise.all([getInitialState(query),getInitialState(query2)]).then(

    x=>{
        const initialValues={
           cid: x[0].campaign_cid,
           states: x[1].lead_filter_sql.match(/'.{2}'/g).map(v=>v.replace(/'/g,"").toUpperCase())

        }
       res.send(initialValues);
    }
    

  );
  /*const Promise1=Promise.resolve(console.log('=>',getInitialState()));
  // console.log('=>',getInitialState());
  const Promise2=Promise.resolve(res.send(JSON.stringify({m: "initialState updated"})));
Promise.all([Promise1,Promise2]);*/
  //res.send(getInitialState());
}) 


app.post('/updateCid', function (req, res) {
    updateCid(req.body.phone);
    res.send("CId updated");
}) 

function updateCid(v){
query="update vicidial_campaigns set campaign_cid='"+v+"' where campaign_id ='PFT'";



connection.query(query, function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0]);
});



}


function updateFilter(ar){
query="update vicidial_lead_filters set lead_filter_sql="+"\"state in ('"+ar.join("','")+"')\""+" where lead_filter_id='PFT_STATES'";



connection.query(query, function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0]);
});

}


function getStatus(ar){
query="select status,count(*) as count from vicidial_list where list_id in (69262,69276,69270) and state in ('"+ar.join("','")+"') and status in ('REG_C','DROP','N','B','ERI','A','NOTAVA','NA','PDROP','NEW') group by 1";


return new Promise(function(resolve, reject){
              connection.query(query, function (error, results, fields) {
                if (error) throw error;
                console.log('The solution is: ', results[0]);
                resolve(results);
              });
    })
}

function getInitialState(q){

        return new Promise(function(resolve, reject){
                        
                        connection.query(q, function (error, results, fields) {
                              if (error) throw error;
                              console.log('The solution is: ', results[0]);
                              results[0];
                          
                              resolve(results[0]);
                           
                        });

        })
} 


app.listen(4000, function () {
  console.log('Example app listening on port 4000!');
});

