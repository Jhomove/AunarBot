// const functions = require('firebase-functions');
const admin = require('firebase-admin');

const API_MESSENGER_TOKEN = "EAAC6lmZCUiVYBACZBZBZC0hqLTq5VCGiuyMi9ZCMiyeOHcxpydkSjJJ0sWymRDfDKoaeZAfPrDtMsS6IYMv0ZBRsPsadzbOqAZAZAbz5PFhcoQImp8zktZBdvpsrOtVAbAIaXZAuOrl9eVsVljpehE4IqDua1ZBtshR6l1FBrdsiZCzaxswZDZD";

var serviceAccount = require("./permissions.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://aunarbot-lnkibg.firebaseio.com"
});


const express = require('express');
const cors = require('cors');
const app = express();
app.use( cors({ origin: true }));

const bodyParser = require('body-parser');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const db = admin.firestore();
const auth = admin.auth();
const fetch = require("node-fetch");
// const request = require('request')
//Routes

app.listen(process.env.PORT || 4500, () => console.log('Listening on port', process.env.PORT || 4500))

//Validate Token
const authUser = async (req, res, next) => {
    try {
        const idToken = req.body.idToken;
        auth.verifyIdToken(idToken)
        .then(function(decodedToken) {
            let uid = decodedToken.uid;
            return next();
        }).catch(function(error) {
            return res.status(401).json({status: 401,error: 'Unathorized'});   
        });
    } catch (error) {
        return res.status(500).send(error);
    }
  };

//Login
//Post
app.post('/api/login',async (req,res) => {
    try {
        const email = req.body.email;
        let userAuth = await auth.getUserByEmail(email);
        auth.createCustomToken(userAuth.uid)
            .then((customToken) => {
                console.log("customToken",customToken);
                return res.status(200).json({
                    status: 200,
                    customToken: customToken,
                    msg: ''
                });
            }
            ).catch(error => res.status(500).send(error))
    } catch (error) {
        
    }
})

//Create
//Post
app.post('/api/create/user', authUser,(req,res) => {
    (async () => {
        try {
            const userAuth = await auth.createUser({ email: req.body.email, password: req.body.password});
            await db.collection('Users').doc('/' + userAuth.uid + "/")
            .create({
                usuarioid : userAuth.uid,
                email : req.body.email,
                nombre : req.body.nombre,
                apellidos : req.body.apellidos,
                identificacion : req.body.identificacion,
                tipoDocumento : req.body.tipoDocumento,
                rol : req.body.rol
            })
            return res.status(200).json({
                status: 200,
                data: {},
                msg: 'Usuario creado correctamente'
            });
        } catch (error) {
            return res.status(500).send(error);
        }
    })();
});

//Read a specific user based on ID
//Get
app.get('/api/read/user/:uid',authUser, (req,res) => {
    (async () => {
        try {
            let userAuth = await auth.getUser(req.params.uid);
            if(!userAuth)
                return res.status(200).json({
                    status: 200,
                    msg: 'No se encontraron coincidencias',
                    data: {}
                })
            let user = await db.collection('Users').doc(req.params.uid).get();
            
            return res.status(200).send({
                status: 200,
                msg: '',
                data: {
                    // auth: userAuth,
                    user: user.data()
                }
            });
        } catch (error) {
            return res.status(500).send(error);
        }
    })();
});

//Read all products
//Get
app.get('/api/read/user', authUser, (req,res) => {
    (async () => {
        try {
            let query = db.collection('Users');
            let response = [];

            await query.get().then(querySnapshot => {
                let docs = querySnapshot.docs;

                for(let doc of docs){
                    const selectedItem = {
                        usuarioid : doc.data().uid,
                        email : doc.data().email,
                        nombre : doc.data().nombre,
                        apellidos : doc.data().apellidos,
                        identificacion : doc.data().identificacion,
                        tipoDocumento : doc.data().tipoDocumento,
                        rol : doc.data().rol,
                    };
                    response.push(selectedItem);
                }
                return response;
            })
            return res.status(200).json({
                status: 200,
                msg: '',
                data: response
            })
        } catch (error) {
            return res.status(500).send(error);
        }
    })();
});

//Update
//Put
app.put('/api/update/user/:uid', authUser, (req,res) => {
    (async () => {
        try {
            let uid = req.params.uid;
            const document = db.collection('Users').doc(uid);

            await auth.updateUser(uid,{
                email: req.body.email,
                password: req.body.password
            })

            await document.update({
                usuarioid : uid,
                email : req.body.email,
                nombre : req.body.nombre,
                apellidos : req.body.apellidos,
                identificacion : req.body.identificacion,
                tipoDocumento : req.body.tipoDocumento,
                rol : req.body.rol
            })
            return res.status(200).json({
                status: 200,
                msg: 'Datos actualizados correctamente',
                data: []
            })
        } catch (error) {
            return res.status(500).send(error);
        }
    })();
});

//Delete
//Delete

app.delete('/api/delete/user/:uid', authUser, (req,res) => {
    (async () => {
        try {
            let uid = req.params.uid;
            const document = db.collection('Users').doc(uid);

            await auth.deleteUser(uid,{
                email: req.body.email,
                password: req.body.password
            })
            await document.delete();
            return res.status(200).json({
                status: 200,
                msg: 'Se ha eliminado correctamente el usuario.',
                data: []
            })
        } catch (error) {
            return res.status(500).send(error);
        }
    })();
});


//Configuraciones interacciones
app.get('/api/read/configuraciones/greeting', async (req,res) => {
    const URL = "https://graph.facebook.com/v6.0/me/messenger_profile?fields=whitelisted_domains,greeting&access_token=" + API_MESSENGER_TOKEN;
    const miInit = {
        method: 'GET',
        headers: {
            'Accept': 'application/json',
            'Accept-Charset': 'utf-8'
        }
    }
    try {
        const response = await fetch(URL)
                            .then(response => response.json())
                            .then(response => response)
                            .catch(error => error)
        if(response.error){
            return res.status(500).json(response.error)
        }
        return res.status(200).json({status: '200', titulo: await response.data[0].greeting[0].text});
    } catch (error) {
        return res.status(500).send(error);
    }
})

//Mensaje de bienvenida

app.post('/api/update/configuracion/greeting',async (req,res) => {
    const data = req.body;
    const data_api = {
        url: "https://graph.facebook.com/v6.0/me/messenger_profile?access_token=" + API_MESSENGER_TOKEN,
        greeting: [{
            "locale": "default",
            "text": data.titulo
        },{
            "locale": "en_US",
            "text": "Hello {{user_first_name}} I am AunarBot!"
        }]
    }
    try {
        const response = await fetch(data_api['url'],{
            method: 'POST',
            body: JSON.stringify({
                greeting: data_api.greeting
            }),
            headers:{
                'Content-Type': 'application/json'
            }
        })

        return res.status(response.status).json({
            status: await response.status,
            msg: await response.statusText,
            data: []
        })
    } catch (error) {
        console.log("error",error)
        return res.status(500).send(error);
    }
})

app.post('/api/create/configuracion/persistent-menu', authUser, async (req,res) => {
    const data = req.body.data;
    const URL = "https://graph.facebook.com/v6.0/me/messenger_profile?access_token=" + API_MESSENGER_TOKEN;
    const callback = db.collection('Configurations').doc("PersistentMenu")
                            .set(data)
                            .then(async () => {
                                try {
                                    const response = await fetch(URL,{
                                        method: 'POST',
                                        body: JSON.stringify(data),
                                        headers:{
                                            'Content-Type': 'application/json'
                                        }
                                    })
                                    console.log("res",response);
                                    return res.status(response.status).json({
                                        status: await response.status,
                                        msg: await response.statusText
                                    })
                                } catch (error) {
                                    console.log("error",error);
                                    return res.status(500).send(error);
                                }
                            })
                            .catch(error => {
                                console.log("error",error);
                                return res.status(500).send(error);
                            })
})

app.get('/api/read/configuracion/persistent-menu', async (req,res) => {
    let postbacks = await db.collection('Configurations').doc('PersistentMenu').get();
            
    return res.status(200).send({
        status: 200,
        msg: '',
        data: postbacks.data()
    });
})

app.post('/api/create/postback', authUser, async (req,res) => {
    const data = req.body.data;
    db.collection('Postbacks').doc(data.key)
        .set(data)
        .then(async() => {
            return res.status(200).json({
                status: 200,
                data: data,
                message: 'Se ha creado correctamente el postback.'
            })
        })
        .catch(error => {
            console.log("error",error);
            return res.status(500).send(error);
        })
});

app.post('/api/update/postback', authUser, async (req,res) => {
    const data = req.body.data;
    console.log("data",data);
    const postback = db.collection('Postbacks').doc(data.key);
    postback.update(data)
        .then(() => {
            return res.status(200).json({
                status: 200,
                data: data,
                message: 'Se ha actualizado correctamente el postback.'
            })
        })
        .catch(error => {
            console.log("error",error);
            return res.status(500).send(error);
        })
})

app.post('/api/delete/postback', authUser, async (req,res) => {
    const data = req.body.data;
    console.log("data",data)
    const postback = db.collection("Postbacks").doc(data.key).delete()
        .then(() => {
            return res.status(200).json({
                status: 200,
                data: {},
                message: 'Se ha eliminado correctamente el postback.'
            }).catch( error => {
                console.log("error",error)
                return res.status(500).send(error);
            })
        })
})

app.get('/api/read/postbacks', async (req,res) => {
    try {
        const postbacks = await db.collection('Postbacks').get();
        if(postbacks.empty) {
            console.log("No matching documents.");
            return res.status(200).json({
                status: 200,
                message: 'No matching documents.',
                data: []
            })
        }
        let response = [];
        postbacks.forEach(doc => {
            console.log("doc",doc.id);
            response.push(doc.data());
        })
        console.log("response",response)
        return res.status(200).json({
            status: 200,
            message: '',
            data: response
        })
    } catch (error) {
        console.log("error",error);
        return res.status(500).send(error);
    }
})

// app.delete('/api/read/configuracion/postbacks')

//WEBHOOK API MESSENGER

// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

    // Your verify token. Should be a random string.
    let VERIFY_TOKEN = 'aunarbot_token';
      
    // Parse the query params
    let mode = req.query['hub.mode'];
    let token = req.query['hub.verify_token'];
    let challenge = req.query['hub.challenge'];
      
    // Checks if a token and mode is in the query string of the request
    if (mode && token) {
    
      // Checks the mode and token sent is correct
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        
        // Responds with the challenge token from the request
        console.log('WEBHOOK_VERIFIED');
        res.status(200).send(challenge);
      
      } else {
        // Responds with '403 Forbidden' if verify tokens do not match
        res.sendStatus(403);      
      }
    }
  });

  //Creates the endpoint for our webhook
  app.post('/webhook', (req, res) => {
      let body = req.body;
      //Verificamos si es un evento de la página suscrita
      if (body.object === 'page') {
          //Iteramos sobre cada entrada 
          body.entry.forEach(entry => {
              //Obtenemos el cuerpo de el evento webhook
              let webhook_event = entry.messaging[0];
              console.log("webhook_event",webhook_event);

              //Obtener el PSID
              let sender_psid = webhook_event.sender.id;
              console.log("Sender PSID: " + sender_psid);

              //Verificamos si el evento es un mensaje o un postback y pasamos el evento a la funcion handler apropiada
              if (webhook_event.message) {
                handleMessage(sender_psid, webhook_event.message);
              } else if (webhook_event.postback) {
                  handlePostback(sender_psid, webhook_event.postback);
              }
          })
          res.status(200).send('EVENT_RECEIVED');
      } else {
          res.sendStatus(404);
      }
  })

  // Handles messages events
function handleMessage(sender_psid, received_message) {
    let response;

    //Verificamos si el mensaje contiene texto
    if (received_message.text){
        //Create the payload for a basic text message
        response = {
            "text": `You sent the message: "${received_message.text}"`
        }
    }

    //Sends the response message
    callSendAPI(sender_psid, response);
}

// Handles messaging_postbacks events
const handlePostback = async (sender_psid, received_postback)  => {
    let payload = received_postback.payload;
    const postbacks = await db.collection('Postbacks').doc(payload)
                            .get()
                            .then(doc => {
                                if(!doc.exists){
                                    console.log("No se encontraron coincidencias.");
                                } else {
                                    console.log("document data",doc.data());
                                    const data = doc.data();
                                    let response = "";
                                    data['content'].forEach(ele => {
                                        switch (ele.type) {
                                            case "text":
                                                response = {[ele.type]: ele.title}
                                                break;
                                            case "generic":
                                                const aux = ele;
                                                delete aux.ident;
                                                delete aux.type;
                                                let buttons = aux.attachment.payload.elements[0].buttons;
                                                const aux_buttons = [];
                                                buttons.forEach((button,key) => {
                                                    if(button.type !== ''){
                                                        // delete buttons[key];
                                                        // return true;
                                                        switch (button.type) {
                                                            case 'web_url':
                                                                if(button.type.url !== '' && button.type.title !== '')
                                                                    aux_buttons.push(button);
                                                                    // delete buttons[key]
                                                                break;
                                                            case 'postback':
                                                                if(button.type.payload !== '' && button.type.title !== '')
                                                                    aux_buttons.push(button);
                                                                break;
                                                            default:
                                                                break;
                                                        }
                                                    }
                                                    return true;
                                                })
                                                if(aux_buttons.length){
                                                    aux.attachment.payload.elements[0].buttons = aux_buttons;
                                                } else{
                                                    delete aux.attachment.payload.elements[0].buttons;
                                                }
                                                response = aux
                                                break;
                                            default:
                                                break;
                                        }
                                        if(response !== ""){
                                            callSendAPI(sender_psid, ele);
                                        }
                                    })
                                }                                
                            })
                            .catch(error => {
                                console.log("Error getting document", error);
                            });
}
//
// Sends response messages via the Send API
const callSendAPI = async (sender_psid, response) => {
  //Construimos el cuerpo del mensaje
  let request_body = {
      "recipient": {
          "id": sender_psid
      },
      "message": response
  }
  console.log("request.body",JSON.stringify(request_body));
  const URL = "https://graph.facebook.com/v6.0/me/messages?access_token=" + API_MESSENGER_TOKEN;
  const myInit = {
      method: "POST",
      body: JSON.stringify(request_body),
      headers:{
        'Content-Type': 'application/json'
      }
  }
  try {
      const callback = await fetch(URL, myInit);
      console.log("message sent!", callback);
  } catch (error) {
      console.error("Unable to send message:" + error);
  }
}

// exports.app = functions.https.onRequest(app);