# Assignations CAP 48
Un outil simple de tirage au sort de médecin à assigner sur une garde

<br>

Le but de cette application est d'en avoir l'utilisation la plus simple et la plus lisible possible :

- Sur la liste de gauche les personnes qui sont susceptibles d'être assignées
- Sur la liste de droite celle qui sont dispensées de tirage au sort (exemptées car déjà assignées, dispensées de garde de nuit s'il s'agit d'une garde de nuit, dispensées car effectuant une garde autour de la garde à assigner)
- Au milieu s'affiche le nom du médecin qui est désigné

<br>

Il y a donc en toile de fond 4 listes qui sont modifiées :

- Une liste des médecins assignables
- Une liste des médecins dispensés qui est la fusion de
  * Une liste de médecins exemptés (déjà assignés auparavant, en arrêt ou disponibilité actuellement)
  * Une liste de médecins dispensés de nuit
  * Une liste de médecins dispensés temporairement sur les jours qui précèdent et suivent la garde à attribuer

<br>

Le procédé de fontionnement est donc simple :

1. Au chargement de la page, le script va chercher le tableau de garde mis à jour sur Internet (en utilisant l'API Open Source "All Origins" qui permet de se défaire des barrières de CORS policy)
2. On sélectionne une date à attribuer, le script extrait de la liste des médecins assignables les médecins qui effectuent une garde le jour même ainsi que les 4 jours avant et après la garde
3. On précise s'il s'agit d'une garde de nuit ou de jour - par défaut de nuit - et en cas de changement de statut, le script met à jour en déplaçant les médecins dispensés de garde de nuit dans la liste des assignables ou des dispensés en fonction de ce choix
4. Il ne reste plus qu'à cliquer sur le bouton "Assigner" qui selon un mode aléatoire détermine un médecin dans la listes des assignables et l'affiche au milieu de la page
5. L'application propose de confirmer ou non l'assignation du médecin désigné et en cas de confirmation, cette personne est retirée de la liste des assignables et ajoutée à la liste des dispensées; Sinon le nom du médecin est affiché mais les listes ne sont pas mises à jour
