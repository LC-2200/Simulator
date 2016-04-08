var student_password_success = false;
var update_instructor_password = false;
var instructor_password_1;

function on_instructor_load() {
    select("id","options_save").js_object.addEventListener("click", function() {
        var student_password_1 = select("id","student_password_1").js_object.value;
        var student_password_2 = select("id","student_password_2").js_object.value;
        instructor_password_1 = select("id","instructor_password_1").js_object.value;
        var instructor_password_2 = select("id","instructor_password_2").js_object.value;

        var update_student_password = false;

        if (student_password_1 != "") {
            if (student_password_1 != student_password_2) {
                alert("Student passwords do not match.", "Oops!");
                return;
            } else {
                update_student_password = true;
            }
        }

        if (instructor_password_1 != "") {
            if (instructor_password_1 != instructor_password_2) {
                alert("Instructor passwords do not match.", "Oops!");
                return;
            } else {
                update_instructor_password = true;
            }
        }

        if (update_student_password) {
            post("./utilities/update_student_password.php", {
                password: password,
                new_student_password: student_password_1
            }, true, function() {
                student_password_success = true;
                success();
            });
        } else {
            student_password_success = true;
        }

        alert("Saving...");
        success();
    });
}

function success() {
    if (student_password_success) {
        if (update_instructor_password) {
            post("./utilities/update_instructor_password.php", {
                password: password,
                new_instructor_password: instructor_password_1
            }, true, function() {
                password = instructor_password_1;
                alert("Options Saved.");
            });
        } else {
            alert("Options Saved.");
        }
    }
}