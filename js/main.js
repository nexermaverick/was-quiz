async function main(all = false){
    const questions = await fetchQuestions("./data/questions.json");
    const selectedQuestions = all ? shuffleArray(questions) : getRandomQuestions(questions, 10);

    renderQuestions(selectedQuestions);
}

function getRandomQuestions(questions, amount) {
    let newQuestions = [];
    let usedIndexes = [];
    console.log(questions)

    while (newQuestions.length < amount) {
        console.log(newQuestions)
        const randomIndex = getRandomInt(0, questions.length - 1);
        const question = questions[randomIndex];
        console.log(question)
        const exists = usedIndexes.includes(randomIndex);

        if(!exists) {
            newQuestions.push(question);
            usedIndexes.push(randomIndex);
        }
    }

    return newQuestions
}

function getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function renderQuestions(questions) {
    const container = document.querySelector("#question-list")
    container.innerHTML = "";

    questions.forEach( ({ question, source }) => {
        const instruction = question.instruction;
        const options = shuffleArray(question.options);

        const form = document.createElement("form");
        form.setAttribute("aria-live", "polite");
        form.setAttribute("aria-atomic", "true")
        form.classList.add("question-container")
        form.addEventListener("submit", (e) => {
            e.preventDefault();

            const formData = new FormData(e.currentTarget);
            const answer = formData.get(instruction);

            if(!answer) return;

            const isCorrect = options.find( opt => opt.text === answer).isCorrect;
            const element = form.querySelector(`input[value="${answer}"]`);
            const text = document.createElement("span");

            if(isCorrect) {
                text.innerText = "(Correct)"
                element.setAttribute("aria-invalid", "false");
                element.parentNode.classList.add("correct");

                const sources = document.createElement("div");
                const sourcesHeading = document.createElement("h3");
                const sourcesList = document.createElement("ul");
                sourcesHeading.innerText = "Sources"
                source.replaceAll("//", "").split("\n").forEach( line => {
                    const li = document.createElement("li");
                    li.innerHTML = markdownToHTML(line)
                    sourcesList.appendChild(li);
                });

                sources.appendChild(sourcesHeading);
                sources.appendChild(sourcesList);
                form.appendChild(sources)
            } else {
                text.innerText = "(Incorrect)";
                element.setAttribute("aria-invalid", "true")
                element.parentNode.classList.add("incorrect");
            }

            element.parentNode.appendChild(text);
        })

        const button = document.createElement("button");
        button.type = "submit";
        button.innerText = "Check answer"

        const heading = document.createElement("h2");
        heading.innerText = instruction;

        const optionElements = options.map( ({ text }) => createOption(text, instruction))

        form.appendChild(heading);
        optionElements.forEach( option => form.appendChild(option))
        form.appendChild(button)
        container.appendChild(form);
    })
}

function markdownToHTML(src) {
    const regex = /\[([^\]]+)\]\(([^)]+)\)/;
    const match = src.match(regex);
    if (match) {
      const text = match[1];
      const url = match[2];
      return `<a href="${url}">${text}</a>`;
    } else {
      return src;
    }
  }

function createOption(option, name, onSelect) {
    const label = document.createElement("label");
    const text = document.createElement("span");
    const radio = document.createElement("input");

    text.innerText = option;
    radio.type = "radio";
    radio.value = option;
    radio.name = name;

    label.appendChild(radio);
    label.appendChild(text);

    return label;
}

function divideSourceIntoQuestions(source) {
    const sourceList = source.split("\n\n");

    // Do not include the first lines, they are only metadata
    const questions = sourceList.slice(2);

    const result = questions.reduce((acc, curr, index, arr) => {
        if(index % 2 !== 0) return acc;

        const question = formatQuestion(arr[index + 1]);
        return [...acc, { source: curr, question }];
    }, [])

    return result
}

function formatQuestion(source) {
    const list = source.split("\n");
    const instruction = list[0];


    const options = list.reduce((acc, curr) => {
        const line = curr.trim();

        if(!line.startsWith("~") && !line.startsWith("=")) return acc;

        const isCorrect = line.startsWith("=");

        return [...acc, { text: curr.replace("~", "").replace("=", "").trim(), isCorrect }]
    }, [])

    return { instruction, options };
}

async function fetchQuestions(path) {
    const response = await fetch(path);
    const result = await response.json();
    return result;
}

document.querySelector("#all-questions-button").addEventListener("click", () => {
    main(true)
})

document.querySelector("#random-questions-button").addEventListener("click", () => {
    main(false)
})