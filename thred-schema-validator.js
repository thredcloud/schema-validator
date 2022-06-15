
module.exports = function(RED) {
    "use strict";

    function ThredSchemaValidator(config) {
        RED.nodes.createNode(this,config);

        let node = this;
        let err;

        const axios = require('axios').default;
        const Ajv2020 = require("ajv/dist/2020");
        const ajv = new Ajv2020({loadSchema: loadSchema});


        async function loadSchema(url) {
            try {
              const response = await axios.get(url);
              return response.data
            } catch (error) {
                throw Error(error);
            }

          }
        

        this.on('input', function(msg, send, done) {

            async function validate(schema_id, payload) {
              let validate_obj;
              let valid;
              let errors;
              let schema;
              // check if valid
              let is_valid = ajv.getSchema(msg.schema_id);
              // if valid, validate
              if (is_valid) {
                validate_obj = is_valid;
              } else {
                // fetch schema
                try {
                  schema = await loadSchema(schema_id);
                } catch (err) {
                  throw Error(err)
              }
                // validate
                validate_obj = await ajv.compileAsync(schema);
              }
              // return
              valid = validate_obj(payload);
              errors = validate_obj.errors;
              return [valid, errors]
            }

            let validation = validate(msg.schema_id, msg.payload)
              .then(function (r) {
                msg.payload.$id = msg.schema_id;
                msg.payload.$valid = r[0];
                if (r[1] !== null) {
                  msg.payload.$errors = r[1];
                }
                // msg.validation = {
                //   "valid": r[0],
                //   "errors": r[1]
                // };
                send(msg);
              })
              .catch(function (err) {
                done(err);
              });

          });
    }

    RED.nodes.registerType("thred-validator",ThredSchemaValidator);
}
