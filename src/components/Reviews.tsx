/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Star, MessageSquarePlus, User, Check, Sparkles } from 'lucide-react';
import { REVIEWS } from '../data';
import { Review } from '../types';
import { fetchAllReviews, createNewReview } from '../api';

export default function Reviews() {
  const [reviewsList, setReviewsList] = useState<Review[]>([]);
  const [showForm, setShowForm] = useState(false);
  
  // New review state variables
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load reviews from live server API
    async function loadReviews() {
      try {
        const data = await fetchAllReviews();
        // Merge fetched reviews with the static permanent ones
        const combined = [...data];
        REVIEWS.forEach(staticReview => {
          if (!combined.some(r => r.id === staticReview.id)) {
            combined.push(staticReview);
          }
        });
        setReviewsList(combined);
      } catch (e) {
        console.error("Error fetching reviews:", e);
        // Fallback to permanent reviews if API fails
        setReviewsList(REVIEWS);
      }
    }
    loadReviews();
  }, []);

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor.trim() || !newComment.trim()) return;

    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');

    const brandNewReview: Review = {
      id: Math.random().toString(36).substring(2, 9),
      author: newAuthor.trim(),
      rating: newRating,
      comment: newComment.trim(),
      date: `${yyyy}-${mm}-${dd}`
    };

    try {
      // Save reviews to live backend database
      const savedReview = await createNewReview(brandNewReview);
      
      setReviewsList((prev) => [savedReview, ...prev]);
      setSubmitted(true);
      setTimeout(() => {
        setSubmitted(false);
        setShowForm(false);
        setNewAuthor('');
        setNewRating(5);
        setNewComment('');
      }, 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <section id="resenas" className="py-24 bg-neutral-950 text-white scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header content header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-[1px] bg-amber-500" />
            <span className="text-amber-500 uppercase tracking-[0.4em] font-mono text-xs font-bold block">
              CLIENTES SATISFECHOS
            </span>
            <div className="w-12 h-[1px] bg-amber-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white uppercase tracking-tight mb-4">
            opiniones de nuestra clientela
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl mt-2">
            Desde que abrimos en 2023, nuestra mayor recompensa es tu satisfacción. Conoce la experiencia de otros clientes o comparte la tuya.
          </p>
        </div>

        {/* Stats and button review row */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 mb-12 p-6 rounded-xl border border-neutral-800 bg-neutral-900/30">
          <div className="flex items-center space-x-6">
            <div className="text-center">
              <div className="text-5xl font-serif font-bold text-amber-500">5.0</div>
              <div className="flex items-center justify-center space-x-0.5 text-amber-400 mt-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-current" />
                ))}
              </div>
              <div className="text-[11px] font-mono text-neutral-400 uppercase mt-2">Puntuación de Clientes</div>
            </div>
            <div className="h-16 w-[1px] bg-neutral-800 hidden sm:block" />
            <div className="hidden sm:block">
              <h4 className="font-serif text-white font-semibold">Servicio 5 estrellas verificado</h4>
              <p className="text-xs text-neutral-400 mt-1">
                Garantizamos máxima higiene, puntualidad rigurosa y acabado impecable por un precio asombroso de 8€ el corte.
              </p>
            </div>
          </div>

          <button
            id="write-review-btn"
            onClick={() => setShowForm(!showForm)}
            className="flex items-center justify-center space-x-2 px-6 py-3.5 bg-neutral-900 border border-neutral-700 hover:border-amber-500/50 text-white font-bold rounded text-xs uppercase tracking-widest cursor-pointer transition-all duration-300 transform"
          >
            <MessageSquarePlus className="w-4 h-4 text-amber-500" />
            <span>Sujetar Opinión</span>
          </button>
        </div>

        {/* Form panel anims */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              id="review-form-panel"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-12 max-w-2xl mx-auto bg-neutral-900 p-6 rounded-xl border border-neutral-800"
            >
              {submitted ? (
                <div className="text-center py-8">
                  <div className="inline-flex p-3 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-full mb-3">
                    <Check className="w-8 h-8 stroke-[3]" />
                  </div>
                  <h4 className="font-serif text-lg text-white font-bold">¡Muchas gracias por tu reseña!</h4>
                  <p className="text-xs text-neutral-400 mt-1">Se ha publicado e incorporado a la lista con éxito.</p>
                </div>
              ) : (
                <form id="submit-review-form-el" onSubmit={handleSubmitReview} className="space-y-4">
                  <h4 className="font-serif text-lg text-white font-bold uppercase tracking-wider mb-2">Escribe tu opinión</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="rev-author" className="text-xs text-neutral-400 block mb-1">Nombre Completo</label>
                      <input
                        type="text"
                        id="rev-author"
                        value={newAuthor}
                        onChange={(e) => setNewAuthor(e.target.value)}
                        placeholder="Ej. Juan Pérez"
                        className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="text-xs text-neutral-400 block mb-1">Puntuación</label>
                      <div className="flex items-center space-x-1.5 py-2">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setNewRating(star)}
                            className="text-amber-400 focus:outline-none hover:scale-115 transition-transform"
                          >
                            <Star className={`w-6 h-6 ${newRating >= star ? 'fill-current' : 'text-neutral-600'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="rev-txt" className="text-xs text-neutral-400 block mb-1">Tu experiencia /Comentario</label>
                    <textarea
                      id="rev-txt"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      placeholder="Cuéntanos cómo fue tu corte o el arreglo de tu barba con Redouan..."
                      rows={3}
                      className="w-full bg-neutral-950 border border-neutral-800 rounded p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-amber-500 text-neutral-950 p-3 rounded font-bold text-xs uppercase tracking-wider cursor-pointer font-serif"
                  >
                    Publicar Reseña
                  </button>
                </form>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Review list cards */}
        {reviewsList.length === 0 ? (
          <div className="text-center py-12 px-4 rounded-xl border border-dashed border-neutral-800 bg-neutral-900/10">
            <span className="text-amber-500/85 block text-2xl mb-2 font-serif">★ ★ ★ ★ ★</span>
            <p className="text-neutral-400 text-sm">Aún no hay opiniones guardadas.</p>
            <p className="text-neutral-500 text-xs mt-1">¡Sé el primero en ayudarnos haciendo clic en "Sujetar Opinión"!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviewsList.map((rev) => (
              <motion.div
                key={rev.id}
                id={`review-item-${rev.id}`}
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4 }}
                className="bg-neutral-900/40 p-6 rounded-xl border border-neutral-800 flex flex-col justify-between"
              >
                <div>
                  {/* Rating score */}
                  <div className="flex items-center space-x-0.5 text-amber-500 mb-4">
                    {(() => {
                      const rating = Math.min(5, Math.max(1, Number(rev.rating) || 5));
                      return (
                        <>
                          {[...Array(rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-current" />
                          ))}
                          {[...Array(5 - rating)].map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-neutral-700" />
                          ))}
                        </>
                      );
                    })()}
                  </div>

                  {/* Comment quote */}
                  <p className="text-neutral-300 text-xs sm:text-sm leading-relaxed italic mb-6">
                    "{rev.comment || ""}"
                  </p>
                </div>

                {/* Client info line */}
                <div className="flex items-center justify-between border-t border-neutral-800/80 pt-4 mt-auto">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-full bg-neutral-800 flex items-center justify-center text-amber-500 font-bold text-xs">
                      {rev.author ? rev.author[0].toUpperCase() : "A"}
                    </div>
                    <div>
                      <h5 className="font-semibold text-white text-xs sm:text-sm">{rev.author || "Anónimo"}</h5>
                      <span className="text-[10px] text-neutral-500 block font-mono">Cliente verificado</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-neutral-400 font-mono">{rev.date || ""}</span>
                </div>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </section>
  );
}
