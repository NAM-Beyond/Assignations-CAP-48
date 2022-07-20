// Mise en places des variables globales qui vont être utilisées à plusieurs reprises dans les différentes fonctions
// On crée une liste de mois car le tableau de garde récupéré sur le site contient des mois affichés en toute lettre
const Mois = ["Janvier", "Février", "Mars", "Avril", "Mai", "Juin", "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"]
var ListeAssignables = JSON.parse(data).assignables.sort();
var ListeExemptes = JSON.parse(data).exemptes.sort();
var ListeDispensesNuit = JSON.parse(data).dispensesnuit.sort();
// Une ListeDispenses qui va être la fusion des exemptés, des dispensés de nuit (si garde de nuit) et des personnes de garde autour de la garde à attribuer
var ListeDispenses = [];
// Comme son nom l'indique, une liste temporaire de dispensés qui effectue une garde autout de la garde à attribuer
var ListeTempDispenses = [];
// La liste dans lequel on va intégrer le tableau de garde à jour avec un format "Jourdelagarde Nomdumédecin"
var ListeGarde = [];
// Nécessité d'une fonction asynchrone car on utilise un fetch pour aller chercher le tableau de garde actualisé sur Lifen
window.onload = async function loaded() {
	// 2 listes différentes, ListeDesignables tiendra compte du retrait des personnes de gardes les jours autour de la date à désignées, si changement de date, la liste sera correctement mise à jour avec ListeAssignables qui n'aura pas été modifiée par le choix de jour
	DrawList("assignables", ListeAssignables);
	// On utilise un Set pour éliminer les doublons de noms
	ListeDispenses = Array.from(new Set(ListeExemptes.concat(ListeDispensesNuit).sort()));
	DrawList("dispensés", ListeDispenses);
	// On utilise un fetch en passant par l'API Open Source 'All Origins' qui permet de contourner les barrières de CORS policy empêchant l'accès aux données du tableau de garde car issues d'un autre domaine
	const response = await fetch(`https://api.allorigins.win/get?url=${encodeURIComponent('https://app.planning.lifen.health/external/plannings/7b11e9c83c58a23dd848#planning')}`);
	const data = await response.json();
	// On récupère le contenu que l'on place dans un div spécialiement prévu à cet effet
	document.getElementById("Frame").innerHTML = data.contents;
	// On en extrait uniquement le tableau du planning et on efface tous les éléments de mise en page dont on n'a pas besoin
	document.getElementById("Frame").innerHTML = document.getElementById("planning").innerHTML.replace(/[\n\t]/g, "").replace(/(^\s+|(?<=[>])\s+(?=[<]))/g, "");
	// De même, on extrait de ce tableau uniquement les mois dont on enlève de nouveau un certain nombre d'éléments inutiles comme les jour de la semaine
	ListeGarde = Array.from(document.getElementsByClassName("month-table")).map(a => a.innerText.split(/\n/)).map(b => b.map(c => c.replace(/\t/g, " ").replace(/( [éA-Z]\.| lun| mar| mer| jeu| ven| sam| dim| AM Samedi| Nuit| Jour Dim et JF)/g, "")));
	// On corrige le fait que les gardes qui se situent le même jour qu'une autre (c'est à dire les gardes de Samedi et Dimanche qui sont coupées en deux) n'ont pas de numéro de jour associé et on rend donc la liste plus uniforme
	ListeGarde = ListeGarde.map((d, e) => d.map((f, g) => f = (f[0] == ' ') ? (isNaN(parseInt(ListeGarde[e][g - 1][1])) ? ListeGarde[e][g - 1][0] + f.substring(1, f.length) : ListeGarde[e][g - 1][0] + ListeGarde[e][g - 1][1] + " " + f.substring(2, f.length)) : f));
	// Dernière correction pour les jours inférieurs à 10 qui n'ont qu'un chiffre ce qui va poser des soucis pour la suite, on rajoute donc un 0 devant
	ListeGarde = ListeGarde.map(h => h.map(i => i = (i[1] == ' ') ? "0" + i[0] + i.substring(1, i.length) : i));
	// On vide le div afin d'éviter des soucis de mise en page, n'ayant plus besoin du contenu du tableau de garde
	document.getElementById("Frame").innerHTML = "";
}
// Fonction qui a pour unique but d'afficher les listes sur la page lorsqu'elles ont été mises à jour (on pourrait très bien ne rien afficher mais le but est que le tirage au sort soit le plus transparent possible)
function DrawList(id, Liste) {
	document.getElementById(id).innerHTML = "<b><u>Médecins " + id + "</u> :</b><br>";
	for (j = 0; j < Liste.length; j++) {
		NewElement = document.createElement("span");
		NewElement.innerHTML = Liste[j];
		NewElement.id = Liste[j];
		NewElement.setAttribute("onclick", "Retirer('" + Liste[j] + "', " + id + ")");
		document.getElementById(id).appendChild(NewElement);
		// On crée un élément de saut de ligne car en l'incluant dans l'élément, étant donné qu'on récupère l'élément via la méthode innerHTML ou innerText, le <br> génère des bugs
		br = document.createElement("br");
		document.getElementById(id).appendChild(br);
	}
}
// Fonction qui se déclenche lorsqu'on modifie la date et l'horaire (Jour / Nuit) de garde à assigner
function UpdateJour() {
	if (JourNuit.value == "jour") {
		// Cela signifie qu'on peut transposer tous les médecins dispensés de nuit dans la liste des assignables en prenant soins de filtrer ce qui sont dispensés pour un autre motif (déjà assignés donc exemptés et effectuant une garde près de la garde à attribuer)
		ListeAssignables = ListeAssignables.concat(ListeDispensesNuit.filter(item => !ListeExemptes.includes(item) && !ListeTempDispenses.includes(item))).sort();
		ListeDispenses = ListeDispenses.filter(item => !ListeDispensesNuit.filter(name => !ListeExemptes.includes(name) && !ListeTempDispenses.includes(name)).includes(item));
	}
	else {
		// Cela signifie qu'il faut ramener les médecins dispensés de nuit dans la liste des dispensés car garde de nuit
		ListeAssignables = ListeAssignables.filter(item => !ListeDispensesNuit.includes(item));
		// On crée un Set qui supprime les doublons puis on le transforme de nouveau en lite
		ListeDispenses = Array.from(new Set(ListeDispenses.concat(ListeDispensesNuit))).sort();
	}
	DrawList("assignables", ListeAssignables);
	DrawList("dispensés", ListeDispenses);
}
// Fonction qui se déclenche lorsqu'on désigne un jour de garde à attribuer dans l'entrée date
function UpdateDate() {
	// On vient de définir une nouvelle date donc la date des dispensés temporaires est donc caduque, on la réaffecte à la liste des assignables en filtrant ceux qui sont dispensés de nuit
	ListeAssignables = ListeAssignables.concat(ListeTempDispenses.filter(item => !ListeDispensesNuit.includes(item))).sort();
	ListeDispenses = ListeDispenses.filter(item => !ListeTempDispenses.filter(name => !ListeDispensesNuit.includes(name)).includes(item));
	ListeTempDispenses = [];
	// On constitue à nouveau la liste des dispensés temporaires en tenant compte de la nouvelle date sélectionnée
	var Date = document.getElementById("Date").value.split(/-/).slice(1, 3);
	for (k = 0; k < ListeGarde.length; k++) {
		// On repère dans quel sous-tableau (mois) se trouve cette garde (on pourrait le définir nominativement mais le tableau change tous les 4 mois, les mois du tableau également, on s'assure que cela fonctionnera tout le temps)
		if (ListeGarde[k][0] == Mois[Date[0] - 1]) {
			for (l = 1; l < ListeGarde[k].length; l++) {
				// On repère à quel rang (jour) se situe la garde afin de commencer à récupérer les noms des médecins à retirer de la liste des assignables
				if (parseInt(ListeGarde[k][l].slice(0,2)) == parseInt(Date[1])) {
					// On renvoit à une fonction spécifique pour retirer de la liste les médecins de gardes le jour même ainsi que les 4 jours suivants et 4 jours précédents
					Extraire(k, l, 5, 1);
					Extraire(k, l - 1, 4, -1);
					break;
				}
			}
		}
	}
	// On met à jours les listes avec la nouvelle liste des dispensés temporaires
	ListeAssignables = ListeAssignables.filter(item => !ListeTempDispenses.includes(item));
	ListeDispenses = Array.from(new Set(ListeDispenses.concat(ListeTempDispenses))).sort();
	DrawList("assignables", ListeAssignables);
	DrawList("dispensés", ListeDispenses);
}
function Extraire(MoisCourant, JourCourant, RangLimite, Sens) {
	for (m = 0; m < RangLimite; m ++) {
		if ([0, ListeGarde[MoisCourant].length].indexOf(JourCourant + m * Sens) > -1) {
			// Cela signifie que l'on est arrivé en bout de mois, soit au début soit à la fin, il font donc basculer sur le mois suivant / précédent tout en conservant la progression déjà effectuée
			MoisCourant += Sens;
			JourCourant = (JourCourant + m * Sens == 0) ? ListeGarde[MoisCourant].length - 1 : 1;
			RangLimite -= m;
			m = 0;
		}
		if (ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[0] == ListeGarde[MoisCourant][JourCourant + m * Sens - 1].split(/(?<=[0-9]) (?=[A-Z])/)[0]) {
			// Cela signifie que l'on a deux gardes le même jour, donc avec le même numéro (Samedi, Dimanche et jours fériés), il font donc rajouter un cran de décompte pour passer au jour suivant et bien avoir 3 jours pris en compte
			RangLimite += 1;
		}
		console.log("Garde du ", ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[0], " effectuée par le Dr. ", ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[1]);
		if (!ListeExemptes.includes(ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[1])) {
			// Pour simplifier les autres opérations, on n'entre pas dans la liste des dispensés temporaires ceux qui sont déjà dispensés (c'est-à-dire soit en arrêt soit déjà assignés)
			console.log("On extrait ce médecin");
			ListeTempDispenses.push(ListeGarde[MoisCourant][JourCourant + m * Sens].split(/(?<=[0-9]) (?=[A-Z])/)[1]);
		}
		else {
			console.log("On n'extrait pas ce médecin, déjà exempté");
		}
	}
}
// Fonction qui tire au sort un des médecins parmi la listes des médecins assignables
function Assigner() {
	document.getElementById("Gagnant").innerHTML = "<b><u>Médecin désigné</u> :</b><br>";
	MedecinDesigne = document.createElement("span");
	MedecinDesigne.innerHTML = ListeAssignables[Math.floor(Math.random() * ListeAssignables.length)];
	document.getElementById("Gagnant").appendChild(MedecinDesigne);
	let assigne = confirm("Confirmez vous l'assignation du Dr. " + Medecin + " ?");
	if (assigne) {
		ListeExemptes.push(Medecin);
		ListeDispenses.push(Medecin);
		ListeDispenses.sort();
		ListeAssignables.splice(ListeAssignables.indexOf(Medecin));
		DrawList("assignables", ListeAssignables);
		DrawList("dispensés", ListeDispenses);
	}
}
// Fonction qui permet de pouvoir manuellement changer de liste un médecin en cliquant sur le nom (ex : anciennement dispensé d'assignation ou finalement assigné)
function Retirer(Medecin, liste) {
	let retirer = confirm("Voulez vous retirer le Dr. " + Medecin + " de la liste des " + liste.id + " ?");
	if (retirer) {
		switch (liste.id) {
			case "assignables":
				ListeAssignables.splice(ListeAssignables.indexOf(Medecin), 1);
				ListeDispenses.push(Medecin);
				let dispensenuit = confirm("Voulez vous ajouter le Dr. " + Medecin + " à la liste des médecins dispensés de nuit ?");
				if (dispensenuit) {
					ListeDispensesNuit.push(Medecin);
				}
				else {
					ListeExemptes.push(Medecin);
				}
				break;
			case "dispensés":
				// Il n'y a pas de superpositions entre la liste exemptés et la liste des dispensés temporaires, en revanche la liste des dispensés de nuit chevauche les deux
				// On retire de base de la liste exemptés si le médecin y figure puis on vérifie qu'il n'appartient pas à une autre des deux liste avant de le retirer complètement de la liste générale
				if (ListeExemptes.includes(Medecin)) {
					ListeExemptes.splice(ListeExemptes.indexOf(Medecin), 1);
				}
				if (ListeDispensesNuit.includes(Medecin)) {
					alert("Le Dr. " + Medecin + " ne peut être retiré.e de la liste des dispensés car il/elle fait déjà parti.e des dispensés de garde de nuit.");
				}
				else if (ListeTempDispenses.includes(Medecin)) {
					alert("Le Dr. " + Medecin + " ne peut être retiré.e de la liste des dispensés car il/elle effectue déjà une garde dans la période de la garde à attribuer");
				}
				// À ce stade, cela signifie que le médecin n'est ni dans la liste des dispensés temporaires ni dans la liste des dispensés de nuit dont il est uniquement dans la liste exemptés et on peut donc le retirer de la liste générale
				else {
					ListeDispenses.splice(ListeDispenses.indexOf(Medecin), 1);
					ListeAssignables.push(Medecin);
				}
				break;
		}
		ListeAssignables.sort();
		DrawList("assignables", ListeAssignables);
		ListeDispenses.sort();
		DrawList("dispensés", ListeDispenses);
	}
}
