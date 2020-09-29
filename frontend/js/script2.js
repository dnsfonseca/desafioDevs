/**
 * Objeto de estado global da aplicação,
 * que será manipulado pelo usuário através dos inputs
 */
const globalState = {
  allDevs: [],
  filteredDevs: [],
  loadingData: true,
  currentFilter: '',

  radioAnd: false,
  radioOr: true,

  checkboxes: [
    {
      filter: 'java',
      description: 'Java',
      checked: true,
      image: './images/java.png',
    },
    {
      filter: 'javascript',
      description: 'JavaScript',
      checked: true,
      image: './images/javascript.png',
    },
    {
      filter: 'python',
      description: 'Python',
      checked: true,
      image: './images/python.png',
    },
  ],
};

/**
 * Variáveis globais que mapeiam elementos HTML
 */
const globalDivDevs = document.querySelector('#divDevs');
const globalInputName = document.querySelector('#inputName');
const globalDivCheckboxes = document.querySelector('#checkboxes');
const globalRadioAnd = document.querySelector('#radioAnd');
const globalRadioOr = document.querySelector('#radioOr');

/**
 * Tudo começa aqui. A invocação desta função é feita
 * na última linha de código deste arquivo
 */
async function start() {
  /**
   * Adicionando eventos aos inputs, checkboxes e radio buttons
   */
  globalInputName.addEventListener('input', handleInputChange);

  globalRadioAnd.addEventListener('input', handleRadioClick);
  globalRadioOr.addEventListener('input', handleRadioClick);

  /**
   * Renderizando os checkboxes de forma dinâmica
   */
  renderCheckboxes();

  /**
   * Obtendo todos os países do backend
   * de forma assíncrona
   */
  await fetchAll();

  /**
   * Iniciamos o app já filtrando os países conforme
   * valor inicial dos inputs
   */
  filterDevs();
}

/**
 * Função para montar os checkboxes
 * dinamicamente a partir de globalState
 */
function renderCheckboxes() {
  const { checkboxes } = globalState;

  const inputCheckboxes = checkboxes.map((checkbox) => {
    const { filter: id, description, checked } = checkbox;

    // prettier-ignore
    return (
        `
        <input class="form-check-input" type="checkbox" id="${id}" checked="${checked}">
        <label class="form-check-label" for="${id}">${description}</label>
        `
    );
  });

  globalDivCheckboxes.innerHTML = inputCheckboxes.join('');

  /**
   * Adicionando eventos
   */
  checkboxes.forEach((checkbox) => {
    const { filter: id } = checkbox;
    const element = document.querySelector(`#${id}`);
    element.addEventListener('input', handleCheckboxClick);
  });
}

/**
 * Esta função é executada somente uma vez
 * e traz todos os países do backend. Além disso,
 * faz uma transformação nos dados, incluindo um
 * campo para facilitar a pesquisa (removendo acentos,
 * espaços em branco e tornando todo o texto minúsculo) e
 * também um array contendo somente o nome das línguas
 * faladas em determinado país
 */
async function fetchAll() {
  const resource = await fetch('http://localhost:3001/devs');
  const json = await resource.json();

  const jsonWithImprovedSearch = json.map((dev) => {
    const { name, programmingLanguages } = dev;

    const lowerCaseName = name.toLocaleLowerCase();

    return {
      ...dev,
      searchName: removeAccentMarksFrom(lowerCaseName)
        .split('')
        .filter((char) => char !== ' ')
        .join(''),
      searchLanguages: getOnlyLanguagesFrom(programmingLanguages),
    };
  });
  /**
   * Atribuindo valores aos campos
   * através de cópia
   */
  globalState.allDevs = [...jsonWithImprovedSearch];
  globalState.filteredDevs = [...jsonWithImprovedSearch];

  globalState.loadingData = false;
}

function handleInputChange({ target }) {
  /**
   * Atribuindo valor do input ao
   * globalState
   */
  globalState.currentFilter = target.value.toLocaleLowerCase().trim();

  filterDevs();
}

/**
 * Lidando com os cliques nos checkboxes
 * de forma dinâmica
 */
function handleCheckboxClick({ target }) {
  const { id, checked } = target;
  const { checkboxes } = globalState;

  /**
   * Refletindo o estado dos checkboxes
   * em globalState
   */
  const checkboxToChange = checkboxes.find(
    (checkbox) => checkbox.filter === id
  );
  checkboxToChange.checked = checked;

  filterDevs();
}

/**
 * Aqui garantimos que uma e somente uma das opções
 * de radio de state permaneça como true. Em seguida,
 * filtramos os países
 */
function handleRadioClick({ target }) {
  const radioId = target.id;

  globalState.radioAnd = radioId === 'radioAnd';
  globalState.radioOr = radioId === 'radioOr';

  filterDevs();
}

/**
 * Função para varrer o array de idiomas
 * e trazer somente o nome em minúsculas, de forma ordenada
 */
function getOnlyLanguagesFrom(programmingLanguages) {
  return programmingLanguages
    .map((language) => language.language.toLocaleLowerCase())
    .sort();
}

/**
 * Função para remover acentos e caracteres especiais
 * de determinado texto
 */
function removeAccentMarksFrom(text) {
  const WITH_ACCENT_MARKS = 'áãâäàéèêëíìîïóôõöòúùûüñ'.split('');
  const WITHOUT_ACCENT_MARKS = 'aaaaaeeeeiiiiooooouuuun'.split('');

  const newText = text
    .toLocaleLowerCase()
    .split('')
    .map((char) => {
      /**
       * Se indexOf retorna -1, indica
       * que o elemento não foi encontrado
       * no array. Caso contrário, indexOf
       * retorna a posição de determinado
       * caractere no array de busca
       */
      const index = WITH_ACCENT_MARKS.indexOf(char);

      /**
       * Caso o caractere acentuado tenha sido
       * encontrado, substituímos pelo equivalente
       * do array b
       */
      if (index > -1) {
        return WITHOUT_ACCENT_MARKS[index];
      }

      return char;
    })
    .join('');

  return newText;
}

function filterDevs() {
  const { allDevs, radioOr, currentFilter, checkboxes } = globalState;

  const filterDevs = checkboxes
    .filter(({ checked }) => checked)
    .map(({ filter }) => filter)
    .sort();

  let filteredDevs = allDevs.filter(({ searchLanguages }) => {
    return radioOr
      ? filterDevs.some((language) => searchLanguages.includes(language))
      : filterDevs.join('') === searchLanguages.join('');
  });

  if (currentFilter) {
    filteredDevs = filteredDevs.filter(({ searchName }) =>
      searchName.includes(currentFilter)
    );
  }

  globalState.filteredDevs = filteredDevs;

  renderDevs();
}

function renderDevs() {
  const { filteredDevs } = globalState;

  const devsToShow = filteredDevs
    .map((dev) => {
      return renderDev(dev);
    })
    .join('');

  const renderedHTML = `
      <h2>${filteredDevs.length} desenvolvedor(es) encontrado(s)</h2>
      <br>
      <div class="row">
        ${devsToShow}
      </div>
  `;

  globalDivDevs.innerHTML = renderedHTML;
}

/**
 * Isolamos a função para renderizar um país,
 * utilizando algumas classes do Materialize
 * e o próprio CSS do app
 */
function renderDev(dev) {
  const { name, picture, searchLanguages } = dev;

  return `
<div class="col-4">
    <div class='card mb-3' style="max-width: 350px;">
      <div class='row no-gutters'>
        <div class="col-md-4">
          <img class='card-img' src="${picture}" alt="${name}" />
        </div>
        <div class='col-md-8'>
          <div class="card-body">
            <span><strong>${name}</strong></span>
            <br>
            <span class='language'>
              <strong>${renderLanguages(searchLanguages)}</strong>
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>  
  `;
}

/**
 * Função para renderizar os idiomas.
 */
function renderLanguages(languages) {
  const { checkboxes } = globalState;
  return languages.map((language) => {
    const item = checkboxes.find((item) => item.filter === language);
    return `
        <img class='img-language' src="${item.image}" alt="${item.description}"/>
        `;
  });
}

/**
 * Inicializando o app
 */
start();
