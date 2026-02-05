import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";
import { Link } from "react-router-dom";

export  function LoginPage() {
  return (
    <div className="fr-container fr-mt-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-6">

          <h1>Connexion</h1>

          <form>
            <Input
              label="Adresse électronique"
              nativeInputProps={{
                type: "email",
                name: "email",
                required: true,
              }}
            />

            <Input
              label="Mot de passe"
              nativeInputProps={{
                type: "password",
                name: "password",
                required: true,
              }}
            />

            <p className="fr-mt-2w">
              <Link to="/forgot-password" className="fr-link">
                Mot de passe oublié ?
              </Link>
            </p>

            <Button type="submit" className="fr-mt-3w">
              Se connecter
            </Button>
          </form>

        </div>
      </div>
    </div>
  );
}
