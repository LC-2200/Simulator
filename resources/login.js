var alert_open = false;
var logged_in = false;
var memory_list;

function on_load() {
    select("id","welcome").js_object.style.transform = "translateX(0%) translateY(-50%)";
    select("id","login_box").js_object.style.transform = "translateX(-50%) translateY(-50%)";
}

function login() {
    var password = select("id","password_field").js_object.value;

    post("./utilities/login.php", {"password": password}, true, function(result) {
        if (result.status == "fail") {
            alert("Invalid password", "Oops!");
            return;
        }

        load_content(result.html, function() {
            var datapath_scripts = document.createElement("script");
            datapath_scripts.innerHTML = result.javascript;
            document.head.appendChild(datapath_scripts);

            if (result.status == "student") {
                on_student_load();
            } else {
                on_instructor_load();
            }
        });
    });
}

select("id","button_login").js_object.addEventListener("click", function() {
    login();
});

select("id","alert_button").js_object.addEventListener("click", function() {
    close_alert();
});

document.addEventListener("keypress", function(e) {
    if (e.keyCode == 13 && !alert_open && !logged_in) {
        login();
    } else if (e.keyCode == 13 && alert_open) {
        close_alert();
    }
});

function load_content(content, callback) {
    var container = select("id","content").js_object;
    container.setAttribute("class", "transparent");
    setTimeout(function() {
        container.innerHTML = content;
        container.setAttribute("class", "");
        callback();
    }, 500);
}

document.onreadystatechange = function() {
    setTimeout(function() {
        on_load();
    }, 50);
};