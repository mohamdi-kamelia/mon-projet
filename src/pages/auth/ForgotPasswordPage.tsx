
import { Link } from "react-router-dom";
import { Button } from "@codegouvfr/react-dsfr/Button";
import { Input } from "@codegouvfr/react-dsfr/Input";


export default function ForgotPasswordPage() {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    //  plus tard (appel API back)
    console.log("Lien de réinitialisation envoyé");
  };

  return (
    <div className="fr-container fr-mt-6w">
      <div className="fr-grid-row fr-grid-row--center">
        <div className="fr-col-12 fr-col-md-6">

          <h1>Mot de passe oublié</h1>

          <p>
            Renseignez votre adresse électronique afin de recevoir un lien de
            réinitialisation de mot de passe.
          </p>

          <form onSubmit={handleSubmit}>
            <Input
              label="Adresse électronique"
              nativeInputProps={{
                type: "email",
                name: "email",
                required: true,
              }}
            />

            <Button type="submit" className="fr-mt-3w">
              Envoyer le lien
            </Button>
          </form>

          <p className="fr-mt-3w">
            <Link to="/login" className="fr-link">
              Retour à la connexion
            </Link>
          </p>

        </div>
      </div>
    </div>
  );
}
