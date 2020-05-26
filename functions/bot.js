const express = require('express');
const app = express();
const { NlpManager } = require('node-nlp');

const manager = new NlpManager({ languages: ['es'] });

//Adds the utterances and intents for the NLP
console.log("puff");
// manager.addDocument('es', 'Buenos días', 'greetings.welcome');
// manager.addDocument('es', 'Buenas tardes', 'greetings.welcome');
// manager.addDocument('es', 'Hola', 'greetings.welcome');

// manager.addDocument('es', 'Adios', 'greetings.bye');
// manager.addDocument('es', 'Hasta luego', 'greetings.bye');
// console.log("ñacañaca");

// //Train also the NLG
// manager.addAnswer('es', 'greetings.welcome', 'Hola que tal soy AunarBot, ¿En que puedo servirte?')
// manager.addAnswer('es', 'greetings.bye', 'Hasta luego!!')

//Train and save the model
// (async () => {
    
// })();

app.listen(process.env.PORT || 4500, async (req,res) => {
    await manager.train();
    manager.save();
    // console.log("hola");
    // const response = await manager.process('es', 'Buen día');
    // console.log("response",response)
})
