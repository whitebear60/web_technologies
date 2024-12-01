
const toast = document.querySelector("#notification")

/**
 * @param {string} msg
 * @param {boolean} success
 */
const showToast = (msg) => {
    const toastBootstrap = bootstrap.Toast.getOrCreateInstance(toast)
    const toastBody = document.querySelector(".toast-body")
    // toastBody.innerHTML = `Запис успішно додано`
    toastBody.innerHTML = msg
    toastBootstrap.show();
}

const modal = new bootstrap.Modal('#login', {
    "backdrop": "static",
    "keyboard": false,
    "focus": true
})
modal.show()

document.querySelectorAll("form").forEach(form => {
    form.addEventListener("submit", (evt) => {
        evt.preventDefault()
        const rpr = document.querySelector("input#register_password_repeat");
        const rp = document.querySelector("input#register_password");
        if (rpr.value !== rp.value) {
            console.warn("ERR_PASSWORD_MISMATCH")
            document.querySelector("#login_passwords_not_match").style.display = "block";
            rpr.setCustomValidity("Passwords don't match")
        } else {
            document.querySelector("#login_passwords_not_match").style.display = "none";
            rpr.setCustomValidity("")
        }

        if (!form.checkValidity()) {
            evt.preventDefault()
            evt.stopPropagation()
        }
        form.classList.add("was-validated")

        // const validityState = rpr.validity;
            // const form = document.querySelector(`#${btn.dataset.form}`)
        const fd = new FormData(form)
        const username = fd.get("username")
        const password = fd.get("password")
        const req = new XMLHttpRequest();
        console.log(form.checkValidity())
        if (form.checkValidity()) {
            req.open(form.method, form.getAttribute("action"))
            req.responseType = "json"
            req.setRequestHeader("Authorization", `Basic ${username}:${password}`);
            req.send();
            req.addEventListener("readystatechange", () => {
                if (req.readyState === XMLHttpRequest.DONE) {
                    if (req.status === 200) {
                        window.location.href = '/';
                    } else {
                        console.log(req.response)
                        console.log(res)
                        showToast(req.response)
                    }
                }
            })
        }
    })
})