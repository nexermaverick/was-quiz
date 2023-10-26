const fs = require("fs/promises");

async function main() {
  const file = "./data/was.gift";
  const contents = await fs.readFile(file, { encoding: "utf-8" });

  const json = parseGift(contents);

  fs.writeFile("./data/was.json", JSON.stringify(json, null, 2));
}

/** This function is mostly AI generated */
function parseGift(giftString) {
  // Split the string into separate questions
  let questions = giftString.split("// question:");

  // Initialize an array to hold the parsed questions
  let parsedQuestions = [];

  // Process each question
  for (let i = 1; i < questions.length; i++) {
    let question = questions[i];

    // Extract the instruction
    let instructionStart = question.indexOf("::Question::") + 12;
    let instructionEnd = question.indexOf("{");
    let instruction = question
      .substring(instructionStart, instructionEnd)
      .trim()
      .replace("[html]", "");

    // Extract the options and source
    let optionsText = question.split("{")[1].split("}")[0].trim().split("\n");
    let options = [];
    let source = "";
    let multiple = false;
    for (let j = 0; j < optionsText.length; j++) {
      if (optionsText[j] !== "") {
        if (optionsText[j].trim().startsWith("####")) {
          source += optionsText[j].substring(5).trim() + " ";
        } else {
          let text = optionsText[j].trim();
          let isCorrect = text[0] === "=";
          if (isCorrect) {
            text = text.substring(1).trim();
          } else if (text[0] === "~") {
            text = text.substring(1).trim();
            if (text.startsWith("%")) {
              multiple = true;
              isCorrect = true;
              text = text.substring(text.indexOf("%", 1) + 1).trim();
            }
          }
          if (text.includes("#")) {
            let hashIndex = text.indexOf("#");
            source += text.substring(hashIndex + 1).trim() + " ";
            text = text.substring(0, hashIndex).trim();
          }
          options.push({
            id: j,
            text: text.replace(/\\/gm, ""),
            isCorrect: isCorrect,
          });
        }
      }
    }

    // Only add the parsed question to the array if it has at least one option
    if (options.length > 0) {
      parsedQuestions.push({
        source: source.trim().replace(/\\/gm, ""),
        question: {
          instruction: instruction,
          options: options,
          multiple: multiple,
        },
      });
    }
  }

  return parsedQuestions;
}

main();
