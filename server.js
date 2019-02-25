const http = require("http");
const fs = require("fs");
const buffer = require("buffer");
const config = {
  env: "dev"
};
http
  .createServer(function(request, response) {
    if (request.method === "POST") {
      postHandle(request, response);
    } else {
      getHandle(request, response);
    }
  })
  .listen(8124);
console.log("server running at port 8124...");

function postHandle(request, response) {
  var reqData = [];
  var size = 0;
  request.on("data", function(data) {
    reqData.push(data);
    size += data.length;
  });
  request.on("end", function() {
    const reqAllData = Buffer.concat(reqData, size);
    const nBuf = buffer.transcode(reqAllData, "utf8", "binary");

    let binaryString = "";
    nBuf.forEach(b => {
      let bs = b.toString(2);
      while (bs.length < 8) {
        bs = "0" + bs;
      }
      binaryString = binaryString + bs;
    });
    console.log(
      ">>post body=",
      nBuf,
      ", length=",
      nBuf.length,
      "byte, binary=",
      binaryString
    );
    response.writeHead(200, {
      "Content-Type": "application/json;charset=UTF-8"
    });
    response.end(
      JSON.stringify({ len: nBuf.length, arr: parseBinary(binaryString) })
    );
  });
}
var htmlFileData = "";
function getHandle(request, response) {
  response.writeHead(200, { "Content-Type": "text-plain" });
  var htmlData = "";
  if (config.env !== "dev" && htmlFileData !== "") {
    htmlData = htmlFileData;
  } else {
    htmlData = fs.readFileSync(__dirname + "/index.html", "utf8");
    htmlFileData = htmlData;
  }

  response.writeHead(200, { "Content-Type": "text/html" });
  response.write(htmlData);
  response.end();
}
/*
 * getDuplicateTimesMap
 * @description 返回24 进制到1000~1023 的映射
 * @return {object} map
 */

function getDuplicateTimesMap() {
  var map = {};
  for (var i = 0; i < 24; i++) {
    var v = i.toString(24);
    var key = i + 1000;
    map[key] = v;
  }
  // console.log("DUPLICATETIMESMAP=", map);
  return map;
}
/*
 * getDuplicateArr
 * @description 返回重复数字的数组
 * @params {number} duplicateNumber 重复的数
 * @params {array} duplicateTimeArr 重复次数
 * @return {array}
 */
function getDuplicateArr(duplicateNumber, duplicateTimeArr) {
  var duplicateTimes = parseInt(duplicateTimeArr.map(d=>DUPLICATETIMESMAP[d]).join(''), 24);
  // console.log('duplicateNumber duplicateTimes=',duplicateNumber,duplicateTimes);
  var resultArr = [];
  while(duplicateTimes--){
    resultArr.push(duplicateNumber)
  }
  // console.log('getDuplicateArr resultArr=',resultArr);
  return resultArr;
}
/*
 * zipDuplicate
 * @description 压缩连续重复的数据
 * @return {array}
 */
function unzipDuplicate(intArr) {
  var resultArr = [];
  var duplicateTimeArr = [];
  var duplicateNumber=null;
  var intArrLen = intArr.length
  intArr.forEach((intData, intDataIndex) => {
    if (intDataIndex == 0) {
      resultArr.push(intData);
    } else if (intData>=1000 && intDataIndex===intArrLen-1) {
      duplicateNumber = intArr[intDataIndex-1]
      resultArr.push(...getDuplicateArr(duplicateNumber, duplicateTimeArr));
      duplicateTimeArr = [];
      duplicateNumber = null;
      resultArr.push(intData);
    } else if (intData>=1000) {
      if(duplicateNumber===null){
        duplicateNumber = intArr[intDataIndex-1]
      }
      duplicateTimeArr.push(intData);
    } else if(duplicateTimeArr.length===0){
      resultArr.push(intData)
    } else {
      resultArr.push(...getDuplicateArr(duplicateNumber, duplicateTimeArr));
      duplicateTimeArr = [];
      duplicateNumber = null;
      resultArr.push(intData);
    }
  });
  // console.log("unzipDuplicate resultArr=", resultArr);
  return resultArr;
}
/*
 * parseBinary
 * @description 2进制数据转换成1000 以内10进制数字
 * @return {array} duplicateArr
 */
var CHARBITLEN = 10;
var DUPLICATETIMESMAP = getDuplicateTimesMap();

function parseBinary(binaryString) {
  var binaryArr = [];
  var numberArr = [];
  var sliceIndex = 0;
  var len = binaryString.length - 1;
  while (sliceIndex + CHARBITLEN < len) {
    binaryArr.push(binaryString.slice(sliceIndex, sliceIndex + CHARBITLEN));
    sliceIndex = sliceIndex + CHARBITLEN;
  }
  // console.log('binaryArr=',binaryArr);
  numberArr.push(...binaryArr.map(b => {
    var radix10 = parseInt(b, 2)
    return radix10
  }));
  var duplicateArr = unzipDuplicate(numberArr);
  // console.log('parseBinary duplicateArr=',duplicateArr);
  return duplicateArr;
}