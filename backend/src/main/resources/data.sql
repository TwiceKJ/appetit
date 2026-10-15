-- Retrato do cardapio frances retornado pela TheMealDB em 2026-10-14.
-- Valores em centavos, conforme os precos exibidos por src/services/pratosFranceses.js.
-- Nao altera precos editados no banco em reinicializacoes posteriores.
INSERT INTO pratos (id, nome, categoria, preco_centavos, imagem_url, disponivel) VALUES
('52904', 'Beef Bourguignon', 'Carnes', 5200, 'https://www.themealdb.com/images/media/meals/vtqxtu1511784197.jpg', 1),
('52914', 'Boulangère Potatoes', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/qywups1511796761.jpg', 1),
('52913', 'Brie wrapped in prosciutto & brioche', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/qqpwsy1511796276.jpg', 1),
('52934', 'Chicken Basquaise', 'Aves', 4400, 'https://www.themealdb.com/images/media/meals/wruvqv1511880994.jpg', 1),
('52920', 'Chicken Marengo', 'Aves', 4400, 'https://www.themealdb.com/images/media/meals/qpxvuq1511798906.jpg', 1),
('52879', 'Chicken Parmentier', 'Aves', 4400, 'https://www.themealdb.com/images/media/meals/uwvxpv1511557015.jpg', 1),
('52910', 'Chinon Apple Tarts', 'Sobremesas', 2500, 'https://www.themealdb.com/images/media/meals/qtqwwu1511792650.jpg', 1),
('52776', 'Chocolate Gateau', 'Sobremesas', 2500, 'https://www.themealdb.com/images/media/meals/tqtywx1468317395.jpg', 1),
('52905', 'Chocolate Souffle', 'Sobremesas', 2500, 'https://www.themealdb.com/images/media/meals/twspvx1511784937.jpg', 1),
('52832', 'Coq au vin', 'Aves', 4400, 'https://www.themealdb.com/images/media/meals/qstyvs1505931190.jpg', 1),
('52907', 'Duck Confit', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/wvpvsu1511786158.jpg', 1),
('52919', 'Fennel Dauphinoise', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/ytttsv1511798734.jpg', 1),
('52918', 'Fish Stew with Rouille', 'Peixes', 4900, 'https://www.themealdb.com/images/media/meals/vptqpw1511798500.jpg', 1),
('52906', 'Flamiche', 'Vegetarianos', 4200, 'https://www.themealdb.com/images/media/meals/wssvvs1511785879.jpg', 1),
('52815', 'French Lentils With Garlic and Thyme', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/vwwspt1487394060.jpg', 1),
('52915', 'French Omelette', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/yvpuuy1511797244.jpg', 1),
('52903', 'French Onion Soup', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/xvrrux1511783685.jpg', 1),
('52916', 'Pear Tarte Tatin', 'Sobremesas', 2500, 'https://www.themealdb.com/images/media/meals/rxvxrr1511797671.jpg', 1),
('52847', 'Pork Cassoulet', 'Carnes', 5200, 'https://www.themealdb.com/images/media/meals/wxuvuv1511299147.jpg', 1),
('52922', 'Prawn & Fennel Bisque', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/rtwwvv1511799504.jpg', 1),
('52921', 'Provençal Omelette Cake', 'Vegetarianos', 4200, 'https://www.themealdb.com/images/media/meals/qwtrtp1511799242.jpg', 1),
('52908', 'Ratatouille', 'Vegetarianos', 4200, 'https://www.themealdb.com/images/media/meals/wrpwuu1511786491.jpg', 1),
('52935', 'Steak Diane', 'Carnes', 5200, 'https://www.themealdb.com/images/media/meals/vussxq1511882648.jpg', 1),
('52911', 'Summer Pistou', 'Vegetarianos', 4200, 'https://www.themealdb.com/images/media/meals/rqtxvr1511792990.jpg', 1),
('52909', 'Tarte Tatin', 'Sobremesas', 2500, 'https://www.themealdb.com/images/media/meals/ryspuw1511786688.jpg', 1),
('52912', 'Three-cheese souffles', 'Acompanhamentos', 3200, 'https://www.themealdb.com/images/media/meals/sxwquu1511793428.jpg', 1),
('52852', 'Tuna Nicoise', 'Peixes', 4900, 'https://www.themealdb.com/images/media/meals/yypwwq1511304979.jpg', 1),
('52917', 'White chocolate creme brulee', 'Sobremesas', 2500, 'https://www.themealdb.com/images/media/meals/uryqru1511798039.jpg', 1)
ON CONFLICT(id) DO NOTHING;
