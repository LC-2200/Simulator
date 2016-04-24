var alert_open = false;
var logged_in = false;
var memory_list;
var password;

// animation on load
function on_load() {
    select("id","welcome").js_object.style.transform = "translateX(0%) translateY(-50%)";
    select("id","login_box").js_object.style.transform = "translateX(-50%) translateY(-50%)";
}

// called to initiate login process
function login() {
    password = select("id","password_field").js_object.value;

    post("./utilities/login.php", {"password": password}, true, function(result) {
        if (result.status == "fail") {
            alert("Invalid password", "Oops!");
            return;
        }

        // putting the returned response into the main content div
        load_content(result.html, function() {
            if (result.status == "student") {
                var microcode = document.createElement("script");
                microcode.innerHTML = result.microcode;
                document.head.appendChild(microcode);

                var datapath_scripts = document.createElement("script");
                datapath_scripts.innerHTML = result.javascript;
                document.head.appendChild(datapath_scripts);
                on_student_load();
            } else {
                datapath_scripts = document.createElement("script");
                datapath_scripts.innerHTML = result.javascript;
                document.head.appendChild(datapath_scripts);
                on_instructor_load();
            }
        });
    });
}

// binding click events to buttons
select("id","button_login").js_object.addEventListener("click", function() {
    login();
});

select("id","alert_button").js_object.addEventListener("click", function() {
    close_alert();
});

// binding key events
document.addEventListener("keypress", function(e) {
    if (e.keyCode == 13 && !alert_open && !logged_in) {
        login();
    } else if (e.keyCode == 13 && alert_open) {
        close_alert();
    }
});

// puts given html content into the main content div with a fade animation
// content: the html code to place in the content div
// callback: function to call upon successful addition of the content to the dom
function load_content(content, callback) {
    var container = select("id","content").js_object;
    container.setAttribute("class", "transparent");
    setTimeout(function() {
        container.innerHTML = content;
        container.setAttribute("class", "");
        callback();
    }, 500);
}

// calls the onload function when the page is ready
document.onreadystatechange = function() {
    setTimeout(function() {
        on_load();
    }, 50);
};