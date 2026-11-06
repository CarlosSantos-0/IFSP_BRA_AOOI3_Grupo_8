import { useId, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import CheckIcon from '@mui/icons-material/Check';
import AddIcon from '@mui/icons-material/Add';
import { useCreateCategory, useUpdateCategory } from '../../hooks/useCategories';
import { CATEGORY_PRESET_COLORS } from '../../utils/formatters';
import styles from './CategoryFormModal.module.css';

const HEX_COLOR = /^#[0-9a-f]{6}$/i;
const MAX_NAME_LENGTH = 30;

const normalize = (value = '') => value.trim().toLocaleLowerCase('pt-BR');

export default function CategoryFormModal({ category = null, categories = [], onClose }) {
  const isEditing = Boolean(category);
  const nameId = useId();
  const hexId = useId();

  const startColor = HEX_COLOR.test(category?.cor ?? '')
    ? category.cor.toLowerCase()
    : CATEGORY_PRESET_COLORS[0];

  const [name, setName] = useState(category?.nome ?? '');
  const [color, setColor] = useState(startColor);
  const [hexText, setHexText] = useState(startColor);
  const [submitted, setSubmitted] = useState(false);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const mutation = isEditing ? updateCategory : createCategory;

  const trimmedName = name.trim();
  const isDuplicate = categories.some(
    (item) => item.id !== category?.id && normalize(item.nome) === normalize(trimmedName),
  );

  let nameError = '';
  if (!trimmedName) nameError = 'Informe um nome para a categoria.';
  else if (isDuplicate) nameError = 'Já existe uma categoria com esse nome.';

  const hexError = HEX_COLOR.test(hexText) ? '' : 'Use um código como #2563eb.';
  const isCustomColor = !CATEGORY_PRESET_COLORS.includes(color);

  const chooseColor = (nextColor) => {
    setColor(nextColor);
    setHexText(nextColor);
  };

  const handleHexChange = (event) => {
    let value = event.target.value.trim();
    if (value && !value.startsWith('#')) value = `#${value}`;
    setHexText(value);
    if (HEX_COLOR.test(value)) setColor(value.toLowerCase());
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);
    if (nameError || hexError) return;

    const payload = { nome: trimmedName, cor: color };

    if (isEditing) {
      updateCategory.mutate({ id: category.id, ...payload }, { onSuccess: onClose });
    } else {
      createCategory.mutate(payload, { onSuccess: onClose });
    }
  };

  return (
    <form className={styles.modal} onSubmit={handleSubmit} noValidate>
      <header className={styles.header}>
        <div>
          <span className={styles.eyebrow}>ORGANIZAÇÃO</span>
          <h2 className={styles.title}>{isEditing ? 'Editar categoria' : 'Nova categoria'}</h2>
        </div>
        <button type="button" className={styles.closeButton} onClick={onClose} aria-label="Fechar">
          <CloseIcon fontSize="small" />
        </button>
      </header>

      <div className={styles.body}>
        <div className={styles.field}>
          <label htmlFor={nameId}>Nome</label>
          <input
            id={nameId}
            type="text"
            value={name}
            maxLength={MAX_NAME_LENGTH}
            placeholder="Ex.: Saúde"
            autoFocus
            onChange={(event) => setName(event.target.value)}
            aria-invalid={submitted && Boolean(nameError)}
          />
          {submitted && nameError && <p className={styles.fieldError}>{nameError}</p>}
        </div>

        <div className={styles.field}>
          <span className={styles.label} id={`${hexId}-label`}>
            Cor de identificação
          </span>

          <div className={styles.swatches} role="radiogroup" aria-labelledby={`${hexId}-label`}>
            {CATEGORY_PRESET_COLORS.map((preset) => {
              const selected = preset === color;

              return (
                <button
                  key={preset}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  aria-label={`Cor ${preset}`}
                  className={`${styles.swatch} ${selected ? styles.swatchSelected : ''}`}
                  style={{ '--swatch-color': preset }}
                  onClick={() => chooseColor(preset)}
                >
                  {selected && <CheckIcon fontSize="small" />}
                </button>
              );
            })}

            <label
              className={`${styles.swatch} ${styles.customSwatch} ${
                isCustomColor ? styles.swatchSelected : ''
              }`}
              style={isCustomColor ? { '--swatch-color': color } : undefined}
              title="Cor personalizada"
            >
              {isCustomColor ? <CheckIcon fontSize="small" /> : <AddIcon fontSize="small" />}
              <input
                type="color"
                className={styles.colorInput}
                value={color}
                onChange={(event) => chooseColor(event.target.value.toLowerCase())}
                aria-label="Escolher uma cor personalizada"
              />
            </label>
          </div>

          <div className={styles.hexRow}>
            <label htmlFor={hexId}>Código da cor</label>
            <div className={styles.hexField}>
              <span className={styles.hexDot} style={{ backgroundColor: color }} aria-hidden="true" />
              <input
                id={hexId}
                type="text"
                value={hexText}
                maxLength={7}
                spellCheck={false}
                onChange={handleHexChange}
                aria-invalid={submitted && Boolean(hexError)}
              />
            </div>
          </div>
          {submitted && hexError && <p className={styles.fieldError}>{hexError}</p>}
        </div>

        {mutation.isError && (
          <p className={styles.formError} role="alert">
            {mutation.error.message}
          </p>
        )}
      </div>

      <footer className={styles.footer}>
        <button type="button" className={styles.cancel} onClick={onClose}>
          Cancelar
        </button>
        <button type="submit" className={styles.save} disabled={mutation.isPending}>
          {mutation.isPending ? 'Salvando...' : 'Salvar'}
        </button>
      </footer>
    </form>
  );
}
