<?php

include_once "instructor_password_hash.php";

$rest_json = file_get_contents("php://input");
$_POST = json_decode($rest_json, true);

// this is used by the instructor page to change the stdudent password
// as expected, this can only be done after authenticating as the instructor

$hashed_token = hash("sha256", $_POST["password"]);

if ($hashed_token == $INSTRUCTOR_PASSWORD_HASH) {
    $hashed_new_token = hash("sha256", $_POST["new_student_password"]);
    file_put_contents("../utilities/student_password_hash.php",
        "<?php \$STUDENT_PASSWORD_HASH = \"".$hashed_new_token."\";");
} else {
    $response = array(
        "status" => "fail"
    );
}

echo json_encode($response);