
    //Store users information in the database after login
    


	$conn = mysqli_connect("sql105.infinityfree.com:3306", "if0_42133316", "Dq9cwpnVaI", "if0_42133316_codeusers");
    
    $user = "";
    $acid = "";
    
    $chkusr = "SELECT * FROM users WHERE $acid = 'acid'";
    $result = mysqli_query($conn, $chkusr);
    
    if(!$result)
    {
        	$acid = "";
        	$_SESSION['new_acid'] = $acid;
        	header("Location: ../users/create_account/");
    }
    else
    {
        
            header("Location: ../users/bot");
    		exit;
        	echo "<pre>";
			print_r($data);
        
        
    }
    
    