const fetch = require("node-fetch");
const fs = require("fs");
const key = "XVapXeXpAc91fcLyT3tQrIzxt7GjEqBQQpiHANLVP8RHSLhOTVUTPnyKU4GX8n4b";
const url = "https://www.thebluealliance.com/api/v3";

let folder = "Week 2";

const sheetID = "1jng8uPY0xKBMcnsEASr5Azc5FwPSj1xraSnmszOE9IA";

const { GoogleSpreadsheet } = require('google-spreadsheet');

const doc = new GoogleSpreadsheet(sheetID);

async function start() {

    await doc.useServiceAccountAuth(require('./creds.json'));
    await doc.loadInfo();
    
    populateSheets(2, true);

}

async function createEvent(key) {

    let sheet = await doc.addSheet({"title": key, headerValues:["Match", "Blue 1", "Blue 2", "Blue 3", "Power Cell Count Blue", "Control Panel Points Blue", "End Game Points Blue", "Foul Blue", "Total Blue", "Red 1", "Red 2", "Red 3", "Power Cell Count Red", "Control Panel Points Red", "End Game Points Red", "Foul Red", "Total Red"]});
    return sheet;

}

function urlBuilder(req) {

    return `${url}${req}?X-TBA-Auth-Key=${key}`;

}

function weeksBetween(d1, d2) {

    return Math.round((d2 - d1) / (7 * 24 * 60 * 60 * 1000));

}

async function populateSheets(week, localStore) {

    let response = await fetch(urlBuilder("/events/2020/simple"));
    let events = await response.json();

    let usingEvents = [];

    let sheetIndex = 0;

    for(let event of events) {

        let date = new Date(event.start_date)
        let week0 = new Date("feb 20, 2020");
        let weekNumber = weeksBetween(week0, date);

        if(weekNumber == week) {

            usingEvents.push(event.key);

            let sheet;
            if(localStore) {

                sheet = [];

            } else {
                
                sheet = await createEvent(event.key);

            }
            sheetIndex ++;

            let res = await fetch(urlBuilder(`/event/${event.key}/matches`));
            let matches = await res.json();

            let rows = [];

            for(let match of matches) {
         
                let matchNumber = match.comp_level + match.match_number;

                let blue = match.alliances.blue.team_keys;
                let red = match.alliances.red.team_keys;

                let powerCellsBlue = match.score_breakdown.blue.autoCellsOuter + match.score_breakdown.blue.autoCellsInner + match.score_breakdown.blue.autoCellsBottom + match.score_breakdown.blue.teleopCellsOuter + match.score_breakdown.blue.teleopCellsInner + match.score_breakdown.blue.teleopCellsBottom;
                let powerCellsRed = match.score_breakdown.red.autoCellsOuter + match.score_breakdown.red.autoCellsInner + match.score_breakdown.red.autoCellsBottom + match.score_breakdown.red.teleopCellsOuter + match.score_breakdown.red.teleopCellsInner + match.score_breakdown.red.teleopCellsBottom;

                let controlPanelBlue = match.score_breakdown.blue.controlPanelPoints;
                let controlPanelRed = match.score_breakdown.red.controlPanelPoints;

                let climbBlue = match.score_breakdown.blue.endgamePoints;
                let climbRed = match.score_breakdown.red.endgamePoints;

                let foulBlue = match.score_breakdown.blue.foulPoints;
                let foulRed = match.score_breakdown.red.foulPoints;
                
                let totalBlue = match.score_breakdown.blue.totalPoints;
                let totalRed = match.score_breakdown.red.totalPoints;

                rows.push({
                    "Match": matchNumber, 
                    "Blue 1": blue[0].substring(3), 
                    "Blue 2": blue[1].substring(3), 
                    "Blue 3": blue[2].substring(3), 
                    "Power Cell Count Blue": powerCellsBlue,	
                    "Control Panel Points Blue": controlPanelBlue, 
                    "End Game Points Blue": climbBlue,
                    "Foul Blue": foulBlue,
                    "Total Blue": totalBlue,
                    "Red 1": red[0].substring(3), 
                    "Red 2": red[1].substring(3), 
                    "Red 3": red[2].substring(3), 
                    "Power Cell Count Red": powerCellsRed, 
                    "Control Panel Points Red": controlPanelRed,
                    "End Game Points Red": climbRed,
                    "Foul Red": foulRed,
                    "Total Red": totalRed
                });

            }

            rows.sort((a, b) => {

                let matchA = (parseInt(a.Match.substring(a.Match.search(/[0-9]/g))));
                let matchB = (parseInt(b.Match.substring(b.Match.search(/[0-9]/g))));
                return matchA - matchB;

            });

            if(localStore) {

                fs.writeFileSync("./" + folder + "/" + event.key + ".json", JSON.stringify(rows, 2));
                

            } else {

                sheet.addRows(rows);

            }

        }

    }
    
    fs.writeFileSync("./" + folder + "/events.json", JSON.stringify(usingEvents));

}

start();
