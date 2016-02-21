<?php

$rest_json = file_get_contents("php://input");
$_POST = json_decode($rest_json, true);

$STUDENT_PASSWORD_HASH = "ca978112ca1bbdcafac231b39a23dc4da786eff8147c4e72b9807785afee48bb";
$INSTRUCTOR_PASSWORD_HASH = "3e23e8160039594a33894f6564e1b1348bbd7a0088d42c4acb73eeaed59c009d";

$hashed_token = hash("sha256", $_POST["password"]);

if ($hashed_token == $STUDENT_PASSWORD_HASH) {
    $response = array(
        "status" => "student",
        "html" => file_get_contents("../secure_content/student.html"),
        "javascript" => file_get_contents("../secure_content/student.js")
    );
} else if ($hashed_token == $INSTRUCTOR_PASSWORD_HASH) {
    $response = array(
        "status" => "instructor",
        "html" => file_get_contents("../secure_content/instructor.html"),
        "javascript" => file_get_contents("../secure_content/instructor.js")
    );
} else {
    $response = array(
        "status" => "fail"
    );
}

echo json_encode($response);