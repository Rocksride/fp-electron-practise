import "./stylesheets/main.css";
// import "./helpers/context_menu.js";
// import "./helpers/external_links.js";
const fs = require("fs");
import Future from "fluture";
import * as R from "ramda";

const DIR_PATH = `E:\\Study\\Study\\7\\Диплом\\Flood\\XLSPath`;

const $ = document.querySelector.bind(document);

//DOM elements
const select = $("#variants");
const percentageSpan = $("#percentage");
const tableWrapper = $("#table-wrapper");

//:: Future(DirectoryData)
const getDir = path =>
  Future.node(done => {
    fs.readdir(path, done);
  });
//:: Future([])
const getFile = path =>
  Future.node(done => {
    fs.readFile(path, "utf8", done);
  })
    .map(compose(parseStrInArr, slice(1), split("\n")))
    .map(arr => ({
      name: path,
      arr
    }));
// const task = () =>
//    getDir(DIR_PATH)
//     .chain(
//::Object(addOption, renderAll)
const optionRenderer = (() => {
  const options = new Set();
  return {
    addOption: option => {
      options.add(option);
    },
    renderAll: () => {
      options.forEach(() => {});
    }
  };
})();

//::Side Effect
const { log: print, error } = console;

const id = x => x;
const split = separator => str => str.split(separator);
const compose = (...fns) =>
  fns
    .reverse()
    .reduce((prevFn, nextFn) => value => nextFn(prevFn(value)), value => value);

const parseStrInArr = arr => {
  return arr.filter(elem => elem !== "").map(subStr => {
    const slicedStr = subStr.split(";");
    return {
      id: parseInt(slicedStr[0]),
      all: parseFloat(slicedStr[1]),
      harmed: parseFloat(slicedStr[2])
    };
  });
};
let arrayOfHarmedNames = null;
const slice = from => str => str.slice(from);

const getAndProcessFiles = dir_path =>
  getDir(dir_path).chain(arr => {
    const filteredArr = arr.filter(path => {
      const arrOfChars = path.split(".");
      return arrOfChars[1] === "txt" && arrOfChars.length === 2;
    });
    return R.traverse(
      Future.of,
      path => getFile(`${dir_path}\\${path}`),
      filteredArr
    );
  });

const appendOptionTo = domElem => name => {
  const optionToAdd = document.createElement("option");
  optionToAdd.text = name;
  optionToAdd.value = name;
  select.appendChild(optionToAdd);
};
const calculateHarmedPercentageForObject = obj => {
  const divideFunc = R.map(({ all, harmed }) => {
    return harmed / all;
  });
  const xform = R.compose(divideFunc);
  let percentage = R.transduce(xform, (acc, curr) => acc + curr, 0, obj.arr);
  return percentage / obj.arr.length;
};
//:: ->Int
const findIndexOfObject = predicateValue => {
  return R.findIndex(R.equals(predicateValue));
};
const generateTable = R.memoize(elem => {
  // const result = calculateHarmedPercentageForObject(targetElem);
  return (
    elem.arr.reduce(
      (acc, { id, all, harmed }) => {
        const str = `
      <tr>
        <td>${id}</td>
        <td>${all}</td>
        <td>${harmed}</td>
        <td>${(harmed / all * 100).toFixed(4)}%</td>
      </tr>`;
        return acc + str;
      },
      `<table>
      <tr>
        <th>Object id</th>
        <th>All area</th>
        <th>Damaged area</th>
        <th>Percentage</th>
      </tr>`
    ) + `</table>`
  );
  // tableWrapper.innerHTML = table;
});
const renderTable = DOMElem => tableElem => {
  DOMElem.innerHTML = tableElem;
};
const renderPercentage = DOMElem => percentage => {
  DOMElem.innerHTML = percentage * 100 + "%";
};
const trace = any => {
  debugger;
  print(any);
  return any;
};
const getByIndex = array => index => {
  return array[index];
};
const changeSelectHandler = ({ data, arrayOfHarmedNames }) => e => {
  R.pipe(
    R.compose(getByIndex(data), findIndexOfObject(e.target.value)),
    R.tap(
      R.compose(
        renderPercentage(percentageSpan),
        calculateHarmedPercentageForObject
      )
    ),
    generateTable,
    R.tap(renderTable(tableWrapper))
  )(arrayOfHarmedNames);
};
const appendToSelect = appendOptionTo(select);
const renderOptionsToDOM = arr => {
  // console.log(arr)
  arr.forEach(obj => appendToSelect(obj));
};

Future.do(function*() {
  const data = yield getAndProcessFiles(DIR_PATH);
  arrayOfHarmedNames = data.map(obj => {
    const splitStr = obj.name.split('\\');
    const result = splitStr[splitStr.length-1].split('.txt')[0].split('_').join(' ');
    return result;
  });
  renderOptionsToDOM(arrayOfHarmedNames);
  select.addEventListener( "change", changeSelectHandler({ data, arrayOfHarmedNames })
  );
}).fork(error, print);
