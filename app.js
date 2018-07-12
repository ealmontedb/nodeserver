
var express = require('express');
var app = express();
var mysql   = require('mysql');


var connection = mysql.createConnection({
  host     : '192.168.0.5',
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


app.get('/listsManager',function(req,res){
       
  res.sendFile('./build/index.html');

});
 
let query="select state,count(*) as count from vicidial_list a,vicidial_lists b where a.list_id = b.list_id and b.campaign_id='FRIMEMSP' group by 1" ;

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

  query="select campaign_cid from vicidial_campaigns  where campaign_id='FRIMEMSP'";
  query2="select lead_filter_sql from vicidial_lead_filters where lead_filter_id ='LIST_GUI'";
  var cal='';
  results=(r)=>{

    cal=r;
  }
  // const Promise1=Promise.resolve(getInitialState(query));

  Promise.all([getInitialState(query),getInitialState(query2)]).then(

    x=>{
        const initialValues={
           cid: x[0].campaign_cid,
           states: x[1].lead_filter_sql.match(/'.{2}'/g).map(v=>v.replace(/'/g,"").toUpperCase()),
           lang:   x[1].lead_filter_sql.match(/mail in \(.*?\)/g)[0].match(/'(.*)'/)[1]

        }
        if(initialValues.lang==='EN'){
          
          initialValues.lang='ENGLISH';

        }else {
          initialValues.lang='SPANISH';
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

app.post('/submitStatus', function (req, res) {
    updateStatus(req.body);
    res.send("status updated");
}) 

app.post('/updateLang', function (req, res) {
    q1="select lead_filter_sql from vicidial_lead_filters where lead_filter_id='LIST_GUI'";
    Promise.all([updateLang(q1)]).then(v=>v[0].lead_filter_sql).then(st=>{
      if(req.body.lang==='ENGLISH'){

        req.body.lang='EN';
      }else{

        req.body.lang='ES';
      }
     
    if (/mail/.test(st)){

      st=st.replace(/mail in \(.*\)/,"mail in ('"+req.body.lang+"')")
      console.log(st)
    }else{
      st=st+" and mail in ('"+req.body.lang+"')";
      console.log(st)
    }
    query="update vicidial_lead_filters set lead_filter_sql=\""+st+"\" where lead_filter_id='LIST_GUI'";
    console.log(query)
    updateLang(query)


   }).then(res.send("lang"))
}) 

function updateCid(v){
query="update vicidial_campaigns set campaign_cid='"+v+"' where campaign_id ='FRIMEMSP'";



connection.query(query, function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0]);
});



}


function updateLang(query){

//query="update vicidial_lead_filters set lead_filter_sql="+"\"state in ('"+ar.join("','")+"')\""+" where lead_filter_id='PFT_STATES'";


return new Promise(function(resolve, reject){
          connection.query(query, function (error, results, fields) {
            if (error) throw error;
            resolve(results[0]);
          });
      })

}

function updateStatus(v){
  let st=v.join().replace(/,/g, " ");   
  query="update vicidial_campaigns set dial_statuses=' "+st+"' where campaign_id ='FRIMEMSP'";
  console.log(query)

connection.query(query, function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0]);
});



}


function updateFilter(ar){

  function readFilter(query){
   return new Promise((resolve,reject)=>{
            connection.query(query, function (error, results, fields) {
                        if (error) throw error;
                        resolve(results[0]);
                      });
                  })

  }

q_read="select lead_filter_sql from vicidial_lead_filters where lead_filter_id='LIST_GUI'";

Promise.all([readFilter(q_read)]).then(x=>x[0].lead_filter_sql).then(st=>{
   console.log("=>first",st)
      st=st.replace(/state in \(.*?\)/,"state in ('"+ar.join("','")+"')")
      st="\""+st+"\""
      console.log('submit=>',st)
      query="update vicidial_lead_filters set lead_filter_sql="+st+" where lead_filter_id='LIST_GUI'";
      connection.query(query, function (error, results, fields) {
          if (error) throw error;
          console.log('The solution is: ', results[0]);
      });
      
    }
)

}


function getStatus(ar){
query="select status,count(*) as count from vicidial_list a,vicidial_lists b  where a.list_id = b.list_id and b.campaign_id='FRIMEMSP' and state in ('"+ar.join("','")+"') and status in ('REG_C','DROP','N','B','ERI','A','NOTAVA','NA','PDROP','NEW') group by 1";


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

