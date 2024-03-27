const toast = document.querySelector("#notification")

/**
 * @param {string} msg
 * @param {boolean} success
 */
const showToast = (msg, success = true) => {
    const toastSquare = document.querySelector("#toast-square");
    const toastHeader = document.querySelector("#toast-header");
    if (success) {
        toastSquare.classList.remove("bg-danger")
        toastSquare.classList.add("bg-success")
        toastHeader.innerHTML = "Успішний запит"
    } else {
        toastHeader.innerHTML = "Помилка"
        toastSquare.classList.add("bg-danger")
        toastSquare.classList.remove("bg-success")
    }
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast)
    const toastBody = document.querySelector(".toast-body")
    // toastBody.innerHTML = `Запис успішно додано`
    toastBody.innerHTML = msg
    toastBootstrap.show();
}

const postForm = document.querySelectorAll("form[method=post]")
postForm.forEach(el => el.addEventListener('submit', (e) => {
    console.log(e);
    e.preventDefault();

    const formData = new FormData(el);
    const req = new XMLHttpRequest();
    console.log(el.getAttribute('action'));
    req.open("post", el.getAttribute('action'))
    req.responseType = "json";
    req.addEventListener("readystatechange", (evt) => {
        console.log(evt)
        console.log(req.readyState)
        console.log(XMLHttpRequest.DONE)
        if (req.readyState === XMLHttpRequest.DONE) {
            if (req.status === 200) {
                showToast(`Запис додано успішно (ID = ${req.response.elementId})`)
            } else {
                showToast(`Помилка при додаванні запису (${req.status} ${req.statusText})`, false)
            }
            if (el.getAttribute("action") === "/sort" && document.getElementById("sort_new").checked && req.status === 200) {
                const newSortReq = new XMLHttpRequest();
                newSortReq.open("post", "/new_sort")
                const newSortFormData = new FormData();
                newSortFormData.set("new_sort_id", req.response.elementId);
                newSortFormData.set("date", document.getElementById("new_sort_selection_date").value)
                newSortFormData.set("comment", document.getElementById("new_sort_comment").value)
                newSortReq.responseType = "json"
                newSortReq.addEventListener("readystatechange", evt => {
                    if (newSortReq.readyState === XMLHttpRequest.DONE) {
                        if (newSortReq.status === 200){
                            showToast(`Запис додано успішно (ID = ${req.response.elementId})`)
                        } else {
                            showToast(`Помилка при додаванні запису (${newSortReq.status} ${newSortReq.statusText})`, false)
                        }
                    }
                })
                newSortReq.addEventListener("error", (evt) => {
                    alert("An error occured")
                    console.error(evt)
                })
                newSortReq.send(newSortFormData)
            }

            // console.log(formData.values())
            console.log(req.response)
            console.log(req.status)
        }
    })
    req.addEventListener("error", (evt) => {
        alert("An error occured")
        console.log(evt)
    })
    req.send(formData)
    return false;
}))

function base64ToUint8(base64) {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

/**
 * @param {Object} response
 * @param {Object} config
 */
const displayEntry = (response, config) => {
    const card = document.querySelector("#display-card")
    const wrap = document.createElement("div")
    wrap.classList.add("row")
    Object.keys(response).forEach(key => {
        const entry = config[key]
        console.log(entry)
        // const node = document.createElement("span")
        // node.innerHTML = JSON.stringify(entry)

        const field = entry.field;
        const type = entry.type;

        const paragraph = document.createElement("p")
        const strong = document.createElement("strong")
        strong.innerText = `${field}: `;

        switch (type) {
            case "enum":
                if (!response[key]) return
                paragraph.innerText = entry['values'][response[key]-1]
                paragraph.prepend(strong)
                wrap.appendChild(paragraph)
                break
            case "boolean":
                response[key] ? paragraph.innerText = "Так" : paragraph.innerText = "Ні"
                paragraph.prepend(strong)
                wrap.appendChild(paragraph)
                break
            case "picture":
                if (!response[key]) return
                const picture = new Blob([base64ToUint8(response[key])])
                const blob = URL.createObjectURL(picture)

                const img = document.createElement("img")
                img.src = blob
                console.log(response[key])
                console.log(picture)
                img.classList.add("mw-100")
                paragraph.appendChild(strong)
                paragraph.appendChild(document.createElement("br"))
                paragraph.appendChild(img)
                wrap.appendChild(paragraph)
                break
            case "date":
                paragraph.innerText = Intl.DateTimeFormat("uk-ua").format(new Date(response[key]))
                paragraph.prepend(strong)
                wrap.appendChild(paragraph)
                break
            default:
                if (!response[key]) return

                paragraph.innerText = response[key]
                paragraph.prepend(strong)

                wrap.appendChild(paragraph)
        }

        // wrap.appendChild(node)
    })
    console.log(wrap)
    card.replaceChildren(wrap);
};


const getForm = document.querySelectorAll("form[method=get]")
getForm.forEach(form => form.addEventListener("submit", e => {
    e.preventDefault()
    const fd = new FormData(form);
    const id = fd.get("id")
    if(id) {
        const action = form.getAttribute("action").slice(1)
        const xhr = new XMLHttpRequest();
        xhr.open("get", `/${action}/${id}`)
        xhr.responseType = "json"
        xhr.addEventListener("readystatechange", (evt) => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                console.log(xhr.status)
                if (xhr.status !== 200) {
                    showToast(`Обʼєкт не знайдено (${xhr.status})`, false);
                }
                const fields = {}
                const config = new XMLHttpRequest();
                config.open("get", "/getconfig")
                config.responseType = "json"
                config.addEventListener("readystatechange", evt => {
                    if(config.readyState === XMLHttpRequest.DONE) {
                        if (config.status === 404) {
                            showToast("Помилка додатку", false)
                        } else {
                            Object.assign(fields, config.response[action])
                            displayEntry(xhr.response, fields)
                        }
                    }
                })
                config.send()

            }
        })
        xhr.send()
    }
}))

// Function to convert file to Base64
function fileToBase64(file, callback) {
    // Create a new file reader
    const reader = new FileReader();

    // Set up a callback function for when the file is loaded
    reader.onload = function(event) {
        // The result attribute contains the data as a data URL
        // We only need the base64 portion of the data URL
        console.log(event.target.result)
        const base64String = event.target.result.split(',')[1];

        // Execute the callback function with the Base64 string
        callback(base64String);
    };

    // Read the file as a data URL
    reader.readAsDataURL(file);
}

const uploadField = document.getElementById("sort_picture");

uploadField.onchange = function() {
    if(this.files[0].size > 1_048_576) {
        alert("File is too big!");
        this.value = "";
    } else {
        console.log("Else")
        fileToBase64(this.files[0], (str) => {
            console.log(str)
        })
    }

};

document.querySelector("#sort_new").addEventListener("change", (evt) => {
    document.querySelector("#new_sort_inputs").classList.toggle("d-none")
    document.querySelector("#new_sort_selection_date").value = ""
    document.querySelector("#new_sort_comment").value = ""
})

const loadSelect = (route, el, fields) => {
    if (el.children[0].dataset.purpose === "load") {
        el.removeChild(el.children[0]);
        const xhr = new XMLHttpRequest();
        xhr.open("get", `/${route}`)
        xhr.responseType = "json"
        xhr.addEventListener("readystatechange", () => {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                xhr.response.forEach(sort => {
                    console.log(sort)
                    const option = document.createElement("option");
                    // option.innerHTML = `${sort.id} | ${sort.name} | ${sort.year}`
                    const caption = []
                    fields.forEach(f => {
                        caption.push(sort[f])
                    })
                    option.innerHTML = caption.join(' | ')
                    option.value = sort[fields[0]]
                    el.appendChild(option)
                })
            }
        })
        xhr.send()
    }
}

const viewAllBtns = document.querySelectorAll("button.view-all[type=reset]")
viewAllBtns.forEach(button => {
    button.addEventListener("click", evt => {
        const f = document.createElement("form");
        const form = evt.target.form
        evt.preventDefault()
        console.log({target: null})
        evt.target.form.reset()
        const xhr = new XMLHttpRequest();
        xhr.responseType = "json"
        xhr.open("get", form.action);
        xhr.addEventListener("readystatechange", evt => {
            if (xhr.readyState === XMLHttpRequest.DONE) {

            }
        })
    })
})