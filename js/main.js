async function main(all = false) {
  const _questions = await Promise.all([
    fetchQuestions("./data/was.json"),
    fetchQuestions("./data/custom.json"),
  ]);

  const questions = _questions.flat();

  const selectedQuestions = all
    ? shuffleArray(questions)
    : getRandomQuestions(questions, 10);

  renderQuestions(selectedQuestions);
}

function getRandomQuestions(questions, amount) {
  let newQuestions = [];
  let usedIndexes = [];

  while (newQuestions.length < amount) {
    const randomIndex = getRandomInt(0, questions.length - 1);
    const question = questions[randomIndex];
    const exists = usedIndexes.includes(randomIndex);

    if (!exists) {
      newQuestions.push(question);
      usedIndexes.push(randomIndex);
    }
  }

  return newQuestions;
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
  const container = document.querySelector("#question-list");
  container.innerHTML = "";

  questions.forEach(({ question, source }) => {
    const instruction = question.instruction;
    const options = shuffleArray(question.options);
    const multiple = question.multiple;

    const form = document.createElement("form");
    form.setAttribute("aria-live", "polite");
    form.setAttribute("aria-atomic", "true");
    form.classList.add("question-container");
    form.addEventListener("submit", (e) => {
      e.preventDefault();

      const formData = new FormData(e.currentTarget);
      const answers = multiple
        ? formData.getAll(instruction)
        : [formData.get(instruction)];

      if (!answers || answers.length === 0) return;

      answers.forEach((answer) => {
        const isCorrect =
          options.find((opt) => opt.id === parseInt(answer))?.isCorrect ||
          false;
        const element = form.querySelector(`input[value="${answer}"]`);
        const text = document.createElement("span");

        if (isCorrect) {
          text.innerText = "(Correct)";
          element.setAttribute("aria-invalid", "false");
          element.parentNode.classList.add("correct");

          if (source) {
            const sources = document.createElement("div");
            const sourcesHeading = document.createElement("h3");
            const sourcesContent = document.createElement("div");

            sourcesContent.innerHTML = source;
            sourcesHeading.innerText = "Sources";

            sources.appendChild(sourcesHeading);
            sources.appendChild(sourcesContent);

            form.appendChild(sources);
          }
        } else {
          text.innerText = "(Incorrect)";
          element.setAttribute("aria-invalid", "true");
          element.parentNode.classList.add("incorrect");
        }

        element.parentNode.appendChild(text);
      });
    });

    const button = document.createElement("button");
    button.type = "submit";
    button.innerText = "Check answer";

    const heading = document.createElement("div");
    heading.innerHTML = instruction;

    const optionElements = options.map(({ text, id }) =>
      createOption(text, id, instruction, multiple),
    );

    form.appendChild(heading);
    optionElements.forEach((option) => form.appendChild(option));
    form.appendChild(button);
    container.appendChild(form);
  });
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

function createOption(option, id, name, checkbox = false) {
  const label = document.createElement("label");
  const text = document.createElement("span");
  const radio = document.createElement("input");

  text.innerHTML = option;
  radio.type = checkbox ? "checkbox" : "radio";
  radio.value = id;
  radio.name = name;

  label.appendChild(radio);
  label.appendChild(text);

  return label;
}

async function fetchQuestions(path) {
  const response = await fetch(path);
  const result = await response.json();
  return result;
}

document
  .querySelector("#all-questions-button")
  .addEventListener("click", () => {
    main(true);
  });

document
  .querySelector("#random-questions-button")
  .addEventListener("click", () => {
    main(false);
  });
