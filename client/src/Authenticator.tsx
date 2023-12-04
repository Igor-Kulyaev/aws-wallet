import {Authenticator as AmplifyAuthenticator} from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";

// @ts-ignore
export const Authenticator = ({children}) => {
 return <AmplifyAuthenticator
  signUpAttributes={["given_name", "family_name", "birthdate"]}
  formFields={{
   signIn: {
    username: {
     label: "Email",
     placeholder: "Enter your email",
    },
   },
   signUp: {
    username: {
     label: "Email",
     placeholder: "Enter your email",
    },
    given_name: {
     label: "First name",
     placeholder: "Enter your first name",
    },
    family_name: {
     label: "Last name",
     placeholder: "Enter your last name",
    },
    birthdate: {
     label: "Birthdate",
     placeholder: "Enter your birthdate",
    },
   },
  }}
 >{children}</AmplifyAuthenticator>
}