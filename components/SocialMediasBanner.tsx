import './SocialMediasBanner.css';

export const SocialMediasBanner = () => {
  return (
    <div className="fr-follow">
      <div className="fr-container">
        <div className="fr-grid-row">
          <div className="fr-col-12">
            <div className="fr-follow__social">
              <h2 className="fr-h5">Suivez-nous <br />sur les réseaux sociaux</h2>
              <ul className="fr-btns-group fr-btns-group--lg">

                <li>
                  <a className="fr-icon-linkedin-box-fill fr-btn" href="https://www.linkedin.com/company/contribcit" target="_blank" title="Profil Linkedin de ContribCit - nouvelle fenêtre">
                  Linkedin</a>
                </li>

                <li>
                  <a className="fr-icon-facebook-box-fill fr-btn" href="https://www.facebook.com/contribcit" target="_blank" title="Profil Facebook de ContribCit - nouvelle fenêtre">
                    Facebook</a>
                </li>
                <li>
                  <a className="fr-icon-instagram-box-fill fr-btn" href="https://www.instagram.com/contribcit" target="_blank" title="Profil Instagram de ContribCit - nouvelle fenêtre">
                    Instagram</a>
                </li>

              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}