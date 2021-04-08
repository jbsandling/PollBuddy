var createError = require("http-errors");
var express = require("express");
var router = express.Router();
var mongoConnection = require("../modules/mongoConnection.js");

router.post("/new", function (req, res) {
  // Get POST data
  var jsonContent = req.body;

  // Validate
  // Name should be present
  if(!jsonContent.Name) {
    return res.status(400).send("Error, Name parameter not specified");
  }

  // TODO: Need to add more validation like length, characters perhaps, etc.

  // Add to DB
  mongoConnection.getDB().collection("polls").insertOne({Name: jsonContent.Name}, function(err, result) {
    if (err) {
      console.log(err);
      return res.sendStatus(500);
    } else {
      if(result.result.ok !== 1) {
        // Failed to insert for some reason
        return res.sendStatus(500);
      } else {
        // Things seemed to be ok, send result message and ID of inserted object
        return res.send({ "Result": "Success", "ID": result.insertedId });
      }
    }
  });

});
router.post("/:id/edit", function (req, res) {
  var id = new mongoConnection.getMongo().ObjectID(req.params.id);
  var jsonContent = req.body;
  if (jsonContent.Action === "Add") {
    if (jsonContent.Questions !== undefined) {//QUESTION IS AN OBJECT https://docs.google.com/document/d/1kFdjwiE4_POgcTDqXK-bcnz4RAeLG6yaF2RxLzkNDrE/edit
      mongoConnection.getDB().collection("polls").updateOne({ "_id": id }, { "$addToSet": { Questions: jsonContent.Questions } }, function (err, res) {
        if (err) {
          return res.sendStatus(500);
        }
      });
    }
    if (jsonContent.Group !== undefined) {
      mongoConnection.getDB().collection("groups").updateOne({ "_id": id }, { "$addToSet": { Group: jsonContent.Group } }, function (err, res) {
        if (err) {
          return res.sendStatus(500);
        }
      });
    } 
    if (jsonContent.Admins !== undefined) {
      mongoConnection.getDB().collection("groups").updateOne({ "_id": id }, { "$addToSet": { Admins: jsonContent.Admins } }, function (err, res) {
        if (err) {
          return res.sendStatus(500);
        }
      });
    } else {
      return res.sendStatus(400);
    }
  } else if (jsonContent.Action === "Remove") {
    if (jsonContent.Questions !== undefined) {
      mongoConnection.getDB().collection("polls").updateOne({ "_id": id }, { "$pull": { Questions: "" } }, function (err, res) {
        if (err) {
          return res.sendStatus(500);
        }
      });
    } 
    if (jsonContent.Group !== undefined) {
      mongoConnection.getDB().collection("groups").updateOne({ "_id": id }, { "$pull": { Group: jsonContent.Group } }, function (err, res) {
        if (err) {
          return res.sendStatus(500);
        }
      });
    }
    if (jsonContent.Admins !== undefined) {
      mongoConnection.getDB().collection("groups").updateOne({ "_id": id }, { "$pull": { Admins: jsonContent.Admins } }, function (err, res) {
        if (err) {
          return res.sendStatus(500);
        }
      });
    } else {
      return res.sendStatus(400);
    }
  } else {
    return res.sendStatus(400);
  }
  return res.sendStatus(200); // TODO: Ensure this is true
});
router.post("/:id/submit", function (req, res) {
  const jsonContent = req.body;
  const pollId = new mongoConnection.getMongo().ObjectID(req.params.id);
  let data = {}; // Stores data being submitted to DB
  let insert = {}; // Stores insertion location

  // Check that pollId was specified and is valid
  if (pollId !== undefined) {
    mongoConnection.getDB().collection("polls").find({ "_id": pollId }).toArray(function (err, result) {
      if (err) {
        return res.sendStatus(500);
      }
      if(result.length === 0) {
        return res.status(500).send({"Result": "Error", "Error": "Cannot find poll"});
      }
    });
  }

  // Check that answers were supplied in the correct format
  if(!jsonContent.Answers) {
    return res.status(500).send({"Result": "Error", "Error": "Answers not specified"});
  }
  if(!Array.isArray(jsonContent.Answers)) {
    return res.status(500).send({"Result": "Error", "Error": "Answers is not an array"});
  }
  if(jsonContent.Answers.empty) {
    return res.status(500).send({"Result": "Error", "Error": "Answers is empty"});
  }

  // Add timestamp to answers
  data.Answers = jsonContent.Answers;
  data.Timestamp = Date.now();

  // Check if the user is logged in or anonymous
  if(req.session.UserID) {
    // User is logged in, save with their ID
    insert["$and"] = [{ "PollID": pollId }, { "UserID": jsonContent.UserID }];
  } else {
    insert["PollID"] = pollId;
  }

  // Save answers function for reducing code reuse
  let save = function() {
    mongoConnection.getDB().collection("poll_answers").updateOne(insert, {"$push": {"Answers": data}}, function (err3, result3) {
      if (err3) {
        return res.sendStatus(500);
      }
      if(result3.result.ok === 1) {
        return res.sendStatus(200);
      } else {
        return res.sendStatus(500);
      }
    });
  };

  // Check for existing answers and save new answers
  mongoConnection.getDB().collection("poll_answers").find(insert).toArray(function (err, result) {
    if (err) {
      return res.sendStatus(500);
    }
    if (result.length === 0) {
      // User/anonymous has not answered any questions in this poll yet, create a default set
      mongoConnection.getDB().collection("poll_answers").insertOne(insert, function(err2, result2) {
        if (err2) {
          return res.sendStatus(500);
        }
        if(result2.result.ok !== 1) {
          return res.sendStatus(500);
        }
        save();
      });

    } else {
      // User/anonymous has answered questions in this poll already, add to existing set
      save();
    }
  });

});



router.get("/pollAnswers", function (req, res, next) {
  var id = new mongoConnection.getMongo().ObjectID(req.params.id);
  mongoConnection.getDB().collection("poll_answers").deleteOne({ "_id": id }, function (err, res) {
    if (err) {
      return res.sendStatus(500);
    }
  });
  return res.sendStatus(200);
});
router.post("/:id/delete", function (req, res) {//use router.delete??
  var id = new mongoConnection.getMongo().ObjectID(req.params.id);
  mongoConnection.getDB().collection("polls").deleteOne({ "_id": id }, function (err, res) {
    if (err) {
      return res.sendStatus(500);
    }
  });
  return res.sendStatus(200);
});
// GET polls listing.
router.get("/", function (req, res, next) {
  mongoConnection.getDB().collection("polls").find({}).toArray(function (err, result) {
    res.send(result);
  });
});
router.get("/:id", function (req, res, next) {
  var id = new mongoConnection.getMongo().ObjectID(req.params.id);
  mongoConnection.getDB().collection("polls").find({ "_id": id }).toArray(function (err, result) {
    if (err) {
      return res.sendStatus(500);
    }
    res.send(result);
  });
});

router.get("/:id/view", function (req, res, next) {
  var id = new mongoConnection.getMongo().ObjectID(req.params.id);
  mongoConnection.getDB().collection("polls").find({ "_id": id }).toArray(function (err, result) {
    if (err) {
      return res.sendStatus(500);
    }
    
    // TODO: Make sure ID is valid

    // Loop through the poll's questions and add to openQuestions the Question Number, Text and Answer Choices if
    // the question is set as Visible.
    let openQuestions = [];
    for(let i = 0; i < result[0].Questions.length; i++) {
      if(result[0].Questions[i][0].Visible) {
        let q = {};
        q.QuestionNumber = result[0].Questions[i][0].QuestionNumber;
        q.QuestionText = result[0].Questions[i][0].QuestionText;
        q.AnswerChoices = result[0].Questions[i][0].AnswerChoices;
        q.MaxAllowedChoices = result[0].Questions[i][0].MaxAllowedChoices;
        q.TimeLimit = result[0].Questions[i][0].TimeLimit;
        openQuestions.push(q);
      }
    }
    // Send the open questions
    res.send({ "Questions": openQuestions, "PollID": id });
  });
});

router.get("/:id/results", function (req, res, next) {
  var id = new mongoConnection.getMongo().ObjectID(req.params.id);
  // TODO: Make sure ID is valid

  mongoConnection.getDB().collection("polls").find({ "_id": id }).toArray(function (err, result) {
    if (err) {
      return res.sendStatus(500);
    }

    mongoConnection.getDB().collection("poll_answers").find({ "PollID": id }).toArray(function (err2, result2) {
      if (err2) {
        return res.sendStatus(500);
      }

      // Loop through the poll's questions and add to openQuestions the Question Number, Text and Answer Choices if
      // the question is set as Visible.
      let results = [];
      for (let i = 0; i < result[0].Questions.length; i++) {
        if (result[0].Questions[i][0].Visible) {
          let q = {};
          q.QuestionNumber = result[0].Questions[i][0].QuestionNumber;
          q.QuestionText = result[0].Questions[i][0].QuestionText;
          q.CorrectAnswers = result[0].Questions[i][0].CorrectAnswers;
          q.AnswerChoices = [];
          q.Tallies = [];

          // Add and tally answers
          for (let k = 0; k < result[0].Questions[i][0].AnswerChoices.length; k++) {
            q.AnswerChoices.push(result[0].Questions[i][0].AnswerChoices[k]);
            let tally = 0;
            for (let j = 0; j < result2[0].Answers.length; j++) {
              if(result2[0].Answers[j].Answers[0].Answer === q.AnswerChoices[k]) {
                tally++;
              }
            }
            q.Tallies.push(tally);
          }

          results.push(q);
        }
      }
      // Send the open questions
      res.send({"Results": results});
    });
  });
});

//Given a userID and a pollID, this function returns true if the user has permission to access the poll, and false otherwise
//if the poll is linked to a group (there is information in the .Group data), the group is checked for user access permissions
//if the poll is not linked, it returns true by default
function checkUserPermission(userID, pollID) { //TODO add checks to make sure IDs are valid
  var groupID = mongoConnection.getDB().collection("polls").find({"_id": pollID}, {"_id":0, "Groups":1})[0].Group; //get groupID attached to poll
  if (groupID.length !== 0 && groupID !== undefined) { //groupID returned something
    var users = mongoConnection.getDB().collection("groups").find({"_id": groupID}, {"_id":0, "Users":1})[0].Users; //get list of users in group
    for (var user in users) {
      if (user === userID) {
        return true;
      }
    }
    return false;
  }
  return true; //returns true if the poll isn't linked to a group
}
//Given an adminID (really just a userID) and a pollID, this function returns true if the user has admin permissions for the poll, and false otherwise
//if the poll is linked to a group (there is information in the .Group data), the group is checked for admin access
//if the poll is not linked, it checks the internal .Admin data and returns true see if it finds the adminID, and false otherwise
function checkAdminPermission(adminID, pollID) { //TODO add checks to make sure IDs are valid
  var groupID = mongoConnection.getDB().collection("polls").find({"_id": pollID}, {"_id":0, "Groups":1})[0].Group; //get groupID attached to the poll
  if (groupID.length === 0 || groupID.length === undefined) { //groupID returned something
    var admins = mongoConnection.getDB().collection("polls").find({"_id": pollID}, {"_id":0, "Admins":1})[0].Admins; //get list of admins in attached group
    for (var admin in admins) { 
      if (admin === adminID) { //check for adminID in list
        return true;
      }
    }
  } else { //groupID didn't return something
    admins = mongoConnection.getDB().collection("groups").find({"_id": groupID}, {"_id":0, "Admins":1})[0].Admins; //get internal list of Admins
    for (admin in admins) {
      if (admin === adminID) { //check for adminID in list
        return true;
      }
    }
  }
  
  return false; //adminID wasn't found
}

module.exports = router;
