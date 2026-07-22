<?php
session_start();
if(isset($_SESSION["email"])){
session_destroy();
}
include_once 'dbConnection.php';
$ref=@$_GET['q'];
$email = $_POST['email'];
$password = $_POST['password'];

$password=md5($password); 
$result = $con->query("SELECT name FROM \"user\" WHERE email = '$email' and password = '$password'");
$count=$result->rowCount();
if($count==1){
while($row = $result->fetch()) {
	$name = $row['name'];
}
$_SESSION["name"] = $name;
$_SESSION["email"] = $email;
header("location:account.php?q=1");
}
else
header("location:$ref?w=Wrong Username or Password");


?>