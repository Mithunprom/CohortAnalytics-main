var std = require('./output.json');
var glob = require('./tst.json'); 
console.log(glob); 
const state1={students:[],studentBasicInfo: []};
var k=0
var w=0
for(var i = 0;i<3; i++) {
    var a=std[i]["ID"]
    var w=k;
    for (var j=k;j<std.length;j++){
    if (a!=std[j]["ID"]){break;}
    state1[studentBasicInfo[i]["studentID"]]=std[j]["ID"];
    state1[studentBasicInfo[i]["firstName"]]= "X"+String(i);
    state1[studentBasicInfo[i]["lastName"]]=  "Y"+String(i);
    state1[student[i]["studentID"]] = std[j]["ID"];
    state1[student[i]["firstName"]]= "X"+String(i);
    state1[student[i]["lastName"]]=  "Y"+String(i);
    state1[student[i]["major"]] = std[j]["Primary Major Plan"],
    state1[student[i]["minor"]] = 'N/A',
    state1[student[i]["concentration"]] = 'N/A',
    state1[student[i]["admittedToProgram"]] = std[w]["Term"];
    state1[student[i]["GPA"]] = 'N/A';
    state1[student[i]["attemptedCreditHours"]] = 'N/A';
    state1[student[i]["completion"]] = 'N/A';
    state1[student[i]["efficiencyRating"]] = 'N/A';
    state1[student[i]["creditsCountedTowardsDegree"]] = 'N/A';
    state1[student[i]["creditsNotCountedTowardsDegree"]] = 'N/A';
    state1[student[i]["reqCompleted"]] = 'N/A';
    state1[student[i]["reqNotCompeleted"]] = 'N/A';
    state1[student[i]["coursesNotCounted"]] = 'N/A';
    k++; 
  }
}